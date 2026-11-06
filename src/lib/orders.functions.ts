import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATALOGO, precoBarril, SABORES_CATALOGO } from "@/lib/catalog";

const METODOS_PAGAMENTO = ["Pix", "Cartão de crédito", "Cartão de débito"] as const;
const CONDICOES_CARTAO = ["Crédito à vista", "Até 3x"] as const;
export const STATUS_PEDIDO = ["pendente", "em_andamento", "confirmado", "cancelado"] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

const itemSchema = z.object({
  sabor: z.string().refine((s) => SABORES_CATALOGO.includes(s), "Sabor inválido"),
  tamanho: z.union([z.literal(30), z.literal(50)]),
  quantidade: z.number().int().min(1).max(20),
});

const pedidoSchema = z.object({
  idempotencyKey: z.string().uuid(),
  nome: z.string().trim().min(1, "Nome obrigatório").max(100),
  telefone: z.string().trim().min(8, "Telefone inválido").max(20),
  endereco: z.string().trim().min(1, "Endereço obrigatório").max(200),
  referencia: z.string().trim().min(1, "Referência obrigatória").max(200),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  horario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido"),
  pagamento: z.enum(METODOS_PAGAMENTO),
  condicaoCartao: z.enum(CONDICOES_CARTAO).optional(),
  observacoes: z.string().trim().max(500).optional(),
  itens: z.array(itemSchema).min(1).max(10),
});

/**
 * Registra um pedido vindo da página pública /pedidos.
 * Valida tudo no servidor (campos, sabores, tamanhos, quantidades) e calcula
 * os preços a partir do catálogo — nunca confia em valores do navegador.
 * O número do pedido vem da sequência do banco. A chave de idempotência
 * evita pedidos duplicados em cliques repetidos: uma segunda chamada com a
 * mesma chave devolve o pedido já gravado.
 */
export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => pedidoSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const linhas = data.itens.map((item) => {
      const unitario = precoBarril(item.sabor, item.tamanho);
      if (unitario === null) throw new Error("Sabor fora do catálogo");
      return { ...item, unitario, total: unitario * item.quantidade };
    });
    const subtotal = linhas.reduce((sum, l) => sum + l.total, 0);

    const { data: pedido, error } = await supabaseAdmin
      .from("orders")
      .insert({
        idempotency_key: data.idempotencyKey,
        customer_name: data.nome,
        phone: data.telefone,
        address: data.endereco,
        reference: data.referencia,
        delivery_date: data.data,
        delivery_time: data.horario,
        payment_method: data.pagamento,
        card_condition: data.pagamento === "Cartão de crédito" ? (data.condicaoCartao ?? null) : null,
        notes: data.observacoes || null,
        subtotal,
      })
      .select("id, order_number")
      .single();

    if (error) {
      // Clique repetido com a mesma chave: devolve o pedido já gravado.
      if (error.code === "23505") {
        const { data: existente } = await supabaseAdmin
          .from("orders")
          .select("id, order_number, subtotal")
          .eq("idempotency_key", data.idempotencyKey)
          .single();
        if (existente) {
          return { orderNumber: existente.order_number, total: Number(existente.subtotal), duplicado: true };
        }
      }
      console.error("[submitOrder] falha ao gravar pedido:", error);
      throw new Error("Não foi possível registrar o pedido. Tente novamente.");
    }

    const { error: erroItens } = await supabaseAdmin.from("order_items").insert(
      linhas.map((l) => ({
        order_id: pedido.id,
        flavor: l.sabor,
        size_liters: l.tamanho,
        quantity: l.quantidade,
        unit_price: l.unitario,
        line_total: l.total,
      })),
    );
    if (erroItens) {
      console.error("[submitOrder] falha ao gravar itens:", erroItens);
      throw new Error("Não foi possível registrar o pedido. Tente novamente.");
    }

    return { orderNumber: pedido.order_number, total: subtotal, duplicado: false };
  });

/** Verifica no servidor se o usuário autenticado tem perfil de administrador. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exigirAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || data !== true) throw new Error("Acesso restrito ao administrador.");
}

/** Informa se o usuário da sessão atual é administrador (usado pela tela /admin). */
export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: data === true };
  });

const filtroSchema = z.object({
  status: z.enum(STATUS_PEDIDO).optional(),
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  busca: z.string().trim().max(100).optional(),
});

/** Lista pedidos para o painel, com filtros de status, período e busca. */
export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => filtroSchema.parse(input ?? {}))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);

    let query = context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.status) query = query.eq("status", data.status);
    if (data.de) query = query.gte("delivery_date", data.de);
    if (data.ate) query = query.lte("delivery_date", data.ate);
    if (data.busca) {
      const termo = data.busca.replace(/[%_,]/g, " ").trim();
      if (termo) {
        const numero = /^\d+$/.test(termo) ? Number(termo) : null;
        query = numero !== null
          ? query.or(`customer_name.ilike.%${termo}%,order_number.eq.${numero}`)
          : query.ilike("customer_name", `%${termo}%`);
      }
    }

    const { data: pedidos, error } = await query;
    if (error) {
      console.error("[listOrders] falha:", error);
      throw new Error("Não foi possível carregar os pedidos.");
    }
    return pedidos;
  });

const atualizacaoSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUS_PEDIDO).optional(),
  valorFinal: z.number().min(0).max(100000).nullable().optional(),
});

/** Atualiza status e/ou valor final confirmado de um pedido (somente admin). */
export const updateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => atualizacaoSchema.parse(input))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);

    const patch: { updated_at: string; status?: StatusPedido; final_value?: number | null } = { updated_at: new Date().toISOString() };
    if (data.status) patch.status = data.status;
    if (data.valorFinal !== undefined) patch.final_value = data.valorFinal;

    const { error } = await context.supabase.from("orders").update(patch).eq("id", data.id);
    if (error) {
      console.error("[updateOrder] falha:", error);
      throw new Error("Não foi possível atualizar o pedido.");
    }
    return { ok: true };
  });
