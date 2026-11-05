/**
 * Catálogo oficial de chopps e preços da HERR AGNES.
 * Fonte única de preços: usada pela página de pedidos e pela validação
 * no servidor — o servidor nunca confia em preços vindos do navegador.
 */
export const CATALOGO = [
  { nome: "Pilsen", p30: 499, p50: 779, descricao: "Leve, dourado e refrescante." },
  { nome: "Puro Malte", p30: 565, p50: 889, descricao: "Encorpado e equilibrado." },
  { nome: "Agnes 08 Zero Glúten", p30: 575, p50: 899, descricao: "Todo o sabor, sem glúten." },
  { nome: "IPA", p30: 669, p50: 1099, descricao: "Aromático e com amargor marcante." },
  { nome: "Munich", p30: 649, p50: 1059, descricao: "Maltado, intenso e especial." },
  { nome: "Red Wein (Chopp de Vinho)", p30: 669, p50: 1099, descricao: "Suave e frutado." },
] as const;

export type SaborCatalogo = (typeof CATALOGO)[number]["nome"];

export const SABORES_CATALOGO = CATALOGO.map((p) => p.nome) as string[];

export type ItemPedido = { sabor: string; tamanho: 30 | 50; quantidade: number };

/** Preço unitário de um barril; null se o sabor não existir no catálogo. */
export function precoBarril(sabor: string, tamanho: 30 | 50): number | null {
  const produto = CATALOGO.find((p) => p.nome === sabor);
  if (!produto) return null;
  return tamanho === 30 ? produto.p30 : produto.p50;
}

/** Total do pedido calculado a partir do catálogo; null se algum item for inválido. */
export function totalPedido(itens: ItemPedido[]): number | null {
  let total = 0;
  for (const item of itens) {
    const preco = precoBarril(item.sabor, item.tamanho);
    if (preco === null || item.quantidade < 1) return null;
    total += preco * item.quantidade;
  }
  return total;
}

export const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
