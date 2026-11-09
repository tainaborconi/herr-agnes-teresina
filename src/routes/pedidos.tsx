import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronDown, Minus, Plus, ShoppingBag } from "lucide-react";
import pedidosBanner from "../assets/black agnes.jpg";
import { whatsappLink } from "@/lib/site";
import { consultarCep, formatarCep, MSG_FORA_AREA, type ResultadoCep } from "@/lib/cep";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, TURNSTILE_SITE_KEY } from "@/lib/supabase-config";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Faça seu pedido — HERR AGNES" },
      { name: "description", content: "Escolha seu chopp, tamanho do barril e agende sua entrega com a HERR AGNES." },
    ],
  }),
  component: Pedidos,
});

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fieldClass = "mt-2 w-full rounded-md border border-[#d7d7d2] bg-white px-3 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#92928d] focus:border-[#941b25] focus:ring-2 focus:ring-[#941b25]/15";

type ProdutoCatalogo = { nome: string; p30: number; p50: number; descricao: string };

const CATALOGO: ProdutoCatalogo[] = [
  { nome: "Pilsen", p30: 499, p50: 779, descricao: "Leve, refrescante e fácil de apreciar." },
  { nome: "Puro Malte", p30: 565, p50: 889, descricao: "Chopp puro malte, com sabor marcante." },
  { nome: "Agnes 08 Zero Glúten", p30: 575, p50: 899, descricao: "Opção zero glúten da HERR AGNES." },
  { nome: "IPA", p30: 669, p50: 1099, descricao: "Chopp IPA, com personalidade e amargor característico." },
  { nome: "Munich", p30: 649, p50: 1059, descricao: "Chopp de estilo Munich, encorpado e saboroso." },
  { nome: "Red Wein (Chopp de Vinho)", p30: 669, p50: 1099, descricao: "Chopp de vinho, ideal para variar na celebração." },
];

type Item = { sabor: string; tamanho: 30 | 50; quantidade: number };

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        action: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

function TurnstileWidget({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action: "order",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.getElementById("cloudflare-turnstile") as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = "cloudflare-turnstile";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
      if (script.dataset["loaded"] === "true") renderWidget();
      script.addEventListener("load", () => { script!.dataset["loaded"] = "true"; }, { once: true });
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onToken]);

  return <div ref={containerRef} className="mt-3 min-h-[65px]" />;
}

function Pedidos() {
  const [itens, setItens] = useState<Item[]>([{ sabor: "Pilsen", tamanho: 30, quantidade: 1 }]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numeroEndereco, setNumeroEndereco] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [pagamento, setPagamento] = useState("Pix");
  const [condicaoCartao, setCondicaoCartao] = useState("Crédito à vista");
  const [observacoes, setObservacoes] = useState("");
  const [cupomDigitado, setCupomDigitado] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState(false);
  const [mensagemCupom, setMensagemCupom] = useState("");
  const [camposPendentes, setCamposPendentes] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = TURNSTILE_SITE_KEY;
  const [cep, setCep] = useState("");
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [resultadoCep, setResultadoCep] = useState<ResultadoCep | null>(null);
  const enderecoAuto = useRef("");
  const areaLiberada = resultadoCep?.status === "atendido";

  const verificarCep = async () => {
    if (consultandoCep) return;
    setConsultandoCep(true);
    setResultadoCep(null);
    const r = await consultarCep(cep);
    setResultadoCep(r);
    setConsultandoCep(false);
    if (r.status === "atendido" && (!endereco.trim() || endereco === enderecoAuto.current)) {
      const sugerido = [r.logradouro, r.bairro, `${r.cidade}-${r.uf}`].filter(Boolean).join(", ");
      enderecoAuto.current = sugerido;
      setEndereco(sugerido);
    }
  };

  const total = useMemo(() => itens.reduce((sum, item) => {
    const produto = CATALOGO.find((p) => p.nome === item.sabor)!;
    return sum + (item.tamanho === 30 ? produto.p30 : produto.p50) * item.quantidade;
  }, 0), [itens]);

  const subtotalZeroGluten = useMemo(() => itens.reduce((sum, item) => {
    if (item.sabor !== "Agnes 08 Zero Glúten") return sum;
    const produto = CATALOGO.find((p) => p.nome === item.sabor)!;
    return sum + (item.tamanho === 30 ? produto.p30 : produto.p50) * item.quantidade;
  }, 0), [itens]);

  const desconto = cupomAplicado ? Math.round(subtotalZeroGluten * 0.10 * 100) / 100 : 0;
  const totalComDesconto = Math.max(0, total - desconto);

  const aplicarCupom = () => {
    if (cupomDigitado.trim().toUpperCase() === "AGNES10" && subtotalZeroGluten > 0) {
      setCupomAplicado(true);
      setCupomDigitado("AGNES10");
      setMensagemCupom("Cupom aplicado! Você ganhou 10% de desconto no Agnes 08 Zero Glúten.");
    } else {
      setCupomAplicado(false);
      setMensagemCupom(cupomDigitado.trim().toUpperCase() === "AGNES10" ? "O cupom AGNES10 é válido somente para o Agnes 08 Zero Glúten. Adicione esse sabor ao pedido para usar o desconto." : "Cupom inválido. Confira o código e tente novamente.");
    }
  };

  const atualizarItem = (index: number, patch: Partial<Item>) => setItens((atual) => atual.map((item, i) => i === index ? { ...item, ...patch } : item));
  const adicionarItem = () => setItens((atual) => [...atual, { sabor: "Pilsen", tamanho: 30, quantidade: 1 }]);
  const removerItem = (index: number) => setItens((atual) => atual.length > 1 ? atual.filter((_, i) => i !== index) : atual);

  const enviarPedido = async () => {
    if (enviando) return;
    if (resultadoCep?.status !== "atendido") {
      setErroEnvio("Confirme primeiro o CEP de entrega. Entregamos apenas em Teresina, Timon e regiões atendidas próximas.");
      document.getElementById("campo-cep")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!turnstileSiteKey || !turnstileToken) {
      setErroEnvio("Confirme a verificação de segurança antes de enviar o pedido.");
      return;
    }
    const pendentes: string[] = [];
    if (!nome.trim()) pendentes.push("Nome completo");
    if (!telefone.trim()) pendentes.push("WhatsApp");
    if (!endereco.trim()) pendentes.push("Endereço completo");
    if (!numeroEndereco.trim()) pendentes.push("Número da residência");
    if (!referencia.trim()) pendentes.push("Ponto de referência");
    if (!data) pendentes.push("Data desejada");
    if (!horario) pendentes.push("Horário desejado");

    if (pendentes.length > 0) {
      setCamposPendentes(pendentes);
      const ids: Record<string, string> = { "Nome completo": "campo-nome", "WhatsApp": "campo-telefone", "Endereço completo": "campo-endereco", "Número da residência": "campo-numero", "Ponto de referência": "campo-referencia", "Data desejada": "campo-data", "Horário desejado": "campo-horario" };
      const elemento = document.getElementById(ids[pendentes[0]!]!);
      elemento?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => elemento?.focus({ preventScroll: true }), 450);
      return;
    }
    setCamposPendentes([]);
    setErroEnvio("");

    const supabaseUrl = SUPABASE_URL;
    const supabaseKey = SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      setErroEnvio("O sistema de pedidos está em configuração. Por favor, fale com a equipe pelo WhatsApp.");
      return;
    }

    // Abre a aba durante o clique do usuário para evitar bloqueio do navegador
    // enquanto o pedido é salvo no banco.
    const whatsappWindow = window.open("about:blank", "_blank");
    if (whatsappWindow) whatsappWindow.opener = null;
    setEnviando(true);
    const getCookieValue = (name: string) =>
      document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))
        ?.split("=").slice(1).join("=") ?? null;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          customer_name: nome.trim(),
          customer_phone: telefone.trim(),
          delivery_address: `${endereco.trim()}, nº ${numeroEndereco.trim()}${complemento.trim() ? `, ${complemento.trim()}` : ""}`,
          delivery_reference: referencia.trim(),
          delivery_date: data,
          delivery_time: horario,
          payment_method: pagamento,
          payment_condition: pagamento === "Cartão de crédito" ? condicaoCartao : null,
          notes: observacoes.trim() || null,
          coupon_code: cupomAplicado ? "AGNES10" : null,
          turnstile_token: turnstileToken,
          fbp: getCookieValue("_fbp"),
          fbc: getCookieValue("_fbc"),
          items: itens.map((item) => ({
            product_name: item.sabor,
            keg_size: item.tamanho,
            quantity: item.quantidade,
          })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.order_number) {
        throw new Error(result.error || "Não foi possível registrar seu pedido. Tente novamente.");
      }

      const numeroPedido = Number(result.order_number);
      const dataFormatada = new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
      const formaPagamento = pagamento === "Cartão de crédito" ? "Cartão de crédito — " + condicaoCartao + (condicaoCartao === "Até 3x" ? " (com acréscimo da máquina)" : "") : pagamento;
      const linhas = itens.map((item, i) => {
        const p = CATALOGO.find((produto) => produto.nome === item.sabor)!;
        const preco = item.tamanho === 30 ? p.p30 : p.p50;
        return `${i + 1}. ${item.sabor} — barril ${item.tamanho}L — ${item.quantidade}x — ${money(preco * item.quantidade)}`;
      }).join("\n");
      const mensagem = [
        `Olá, ${nome}! Segue abaixo o resumo do seu pedido:`,
        "",
        `━━━━━━━━━━━━━━━━━━━━`,
        `🧾 *PEDIDO #${numeroPedido}*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        "",
        "*DADOS DO CLIENTE*",
        `👤 Nome: ${nome}`,
        `📱 Telefone: ${telefone}`,
        `📍 Endereço: ${endereco}`,
        `🔢 Número: ${numeroEndereco}`,
        complemento.trim() ? `🏠 Complemento: ${complemento.trim()}` : null,
        `📮 CEP: ${formatarCep(resultadoCep.cep)} (${resultadoCep.cidade}-${resultadoCep.uf})`,
        `📌 Referência: ${referencia}`,
        "",
        "*ITENS DO PEDIDO*",
        linhas,
        "",
        cupomAplicado ? `🎟️ Cupom AGNES10: 10% de desconto (-${money(desconto)})` : null,
        cupomAplicado ? `💰 *TOTAL COM DESCONTO: ${money(totalComDesconto)}*` : `💰 *TOTAL DO PEDIDO: ${money(total)}*`,
        "",
        "*ENTREGA*",
        `📅 Data desejada: ${dataFormatada}`,
        `🕒 Horário desejado: ${horario}`,
        "",
        "*PAGAMENTO*",
        `💳 Forma de pagamento: ${formaPagamento}`,
        observacoes ? `📝 Observações: ${observacoes}` : null,
        "",
        "*A data, o horário e as condições de entrega estão sujeitos à confirmação da equipe HERR AGNES.*"
      ].filter((linha) => linha !== null).join("\n");

      const pixelWindow = window as Window & {
        fbq?: (...args: (string | Record<string, unknown>)[]) => void;
      };
      pixelWindow.fbq?.("track", "Lead", {
        value: Number(totalComDesconto.toFixed(2)),
        currency: "BRL",
        order_id: String(numeroPedido),
      });

      const url = whatsappLink(mensagem);
      if (whatsappWindow) {
        whatsappWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      whatsappWindow?.close();
      setErroEnvio(error instanceof Error ? error.message : "Não foi possível enviar seu pedido. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <section className="w-full overflow-hidden bg-[#171717]">
        <img
          src={pedidosBanner}
          alt="HERR AGNES — chopp para celebrar"
          className="mx-auto block h-auto w-full object-contain"
        />
      </section>

      <section className="bg-[#f7f7f5] text-[#171717]"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.5fr_0.8fr] lg:py-16">
        <div className="space-y-10">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#941b25] text-white font-semibold">1</span>
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#941b25]">Escolha seus produtos</p><h2 className="mt-1 text-2xl md:text-3xl">Monte seu pedido</h2></div>
            </div>
            <div className="space-y-4">
              {itens.map((item, index) => {
                const produto = CATALOGO.find((p) => p.nome === item.sabor)!;
                const preco = item.tamanho === 30 ? produto.p30 : produto.p50;
                return (
                  <div key={index} className="rounded-lg border bg-white p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-xs text-[#941b25]">BARRIL {index + 1}</p><h3 className="mt-1 text-xl">{item.sabor}</h3></div>
                      {itens.length > 1 && <button type="button" onClick={() => removerItem(index)} className="text-xs text-[#686868] underline hover:text-[#171717]">Remover</button>}
                    </div>
                    <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-[#686868]">Sabor</label>
                    <div className="relative">
                      <select className={fieldClass} value={item.sabor} onChange={(e) => atualizarItem(index, { sabor: e.target.value })}>
                        {CATALOGO.map((p) => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-5 text-[#686868]" size={16} />
                    </div>
                    <p className="mt-2 text-xs text-[#686868]">{produto.descricao}</p>
                    <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-[#686868]">Tamanho do barril</label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {([30, 50] as const).map((size) => {
                        const price = size === 30 ? produto.p30 : produto.p50;
                        return <button type="button" key={size} onClick={() => atualizarItem(index, { tamanho: size })} className={`rounded-md border p-4 text-left transition ${item.tamanho === size ? "border-[#941b25] bg-[#941b25]/[0.06] ring-1 ring-[#941b25]" : "border-[#deded9] bg-[#f1f1ee] hover:border-[#941b25]/60"}`}>
                          <span className="block text-lg font-bold">{size} litros</span><span className="mt-1 block text-sm text-[#941b25]">{money(price)}</span><span className="mt-1 block text-xs text-[#686868]">{money(price / size)} por litro</span>
                        </button>;
                      })}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-sm text-[#686868]">Quantidade</span>
                      <div className="flex items-center gap-4">
                        <button type="button" aria-label="Diminuir quantidade" onClick={() => atualizarItem(index, { quantidade: Math.max(1, item.quantidade - 1) })} className="rounded-full border p-2 hover:bg-[#f1f1ee]"><Minus size={15}/></button>
                        <span className="min-w-4 text-center font-semibold">{item.quantidade}</span>
                        <button type="button" aria-label="Aumentar quantidade" onClick={() => atualizarItem(index, { quantidade: Math.min(20, item.quantidade + 1) })} className="rounded-full border p-2 hover:bg-[#f1f1ee]"><Plus size={15}/></button>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between border-t pt-4 text-sm"><span className="text-[#686868]">Subtotal deste item</span><strong className="text-[#941b25]">{money(preco * item.quantidade)}</strong></div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={adicionarItem} className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#941b25] px-5 py-3 text-sm font-semibold text-[#941b25] transition hover:bg-[#941b25]/[0.06]"><Plus size={16}/> Adicionar outro barril</button>
            <p className="mt-4 text-xs leading-relaxed text-[#686868]">Todos os pedidos incluem barril lacrado, chopeira elétrica e kit de extração.</p>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#941b25] text-white font-semibold">2</span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#941b25]">Seus dados</p><h2 className="mt-1 text-2xl md:text-3xl">Onde vamos entregar?</h2></div></div>
            <div className="rounded-lg border bg-white p-5 md:p-6">
              <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); void verificarCep(); }}>
                <label className="flex-1 text-sm">CEP de entrega<input id="campo-cep" className={fieldClass} value={cep} onChange={(e) => { setCep(formatarCep(e.target.value)); setResultadoCep(null); }} placeholder="00000-000" inputMode="numeric" autoComplete="postal-code" maxLength={9} /></label>
                <button type="submit" disabled={consultandoCep} className="rounded-md bg-[#941b25] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#76151d] disabled:cursor-wait disabled:opacity-60">{consultandoCep ? "Consultando..." : "Verificar CEP"}</button>
              </form>
              {resultadoCep?.status === "atendido" && <p role="status" className="mt-4 flex gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={18} className="shrink-0" /> Ótimo! Entregamos em {resultadoCep.cidade}-{resultadoCep.uf}. Continue preenchendo seus dados.</p>}
              {resultadoCep?.status === "fora_area" && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">CEP de {resultadoCep.cidade}-{resultadoCep.uf}. {MSG_FORA_AREA}</p>}
              {resultadoCep && resultadoCep.status !== "atendido" && resultadoCep.status !== "fora_area" && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{resultadoCep.mensagem}</p>}
              {!resultadoCep && <p className="mt-3 text-xs text-[#686868]">Informe o CEP para continuar. Atendemos Teresina-PI e Timon-MA.</p>}
            </div>
            <fieldset disabled={!areaLiberada} aria-disabled={!areaLiberada} className={`grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-2 md:p-6 transition ${areaLiberada ? "" : "pointer-events-none select-none opacity-40"}`}>
              <label className="text-sm">Nome completo<input id="campo-nome" className={fieldClass} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos chamar você?" autoComplete="name" required /></label>
              <label className="text-sm">WhatsApp<input id="campo-telefone" className={fieldClass} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel" required /></label>
              <label className="text-sm md:col-span-2">Endereço completo<input id="campo-endereco" className={fieldClass} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, bairro e cidade" autoComplete="street-address" required /></label>
              <label className="text-sm">Número da residência<input id="campo-numero" className={fieldClass} value={numeroEndereco} onChange={(e) => setNumeroEndereco(e.target.value)} placeholder="Ex.: 123" inputMode="numeric" required /></label>
              <label className="text-sm">Complemento <span className="text-[#686868]">(opcional)</span><input className={fieldClass} value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco, casa..." autoComplete="address-line2" /></label>
              <label className="text-sm md:col-span-2">Ponto de referência<input id="campo-referencia" className={fieldClass} value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ex.: próximo à praça..." required /></label>
            </fieldset>
          </div>

          <fieldset disabled={!areaLiberada} aria-disabled={!areaLiberada} className={`space-y-10 transition ${areaLiberada ? "" : "pointer-events-none select-none opacity-40"}`}>
          <div>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#941b25] text-white font-semibold">3</span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#941b25]">Agendamento</p><h2 className="mt-1 text-2xl md:text-3xl">Quando deseja receber?</h2></div></div>
            <div className="grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-2 md:p-6">
              <label className="text-sm">Data desejada<input id="campo-data" className={fieldClass} type="date" min={new Date().toLocaleDateString("en-CA")} value={data} onChange={(e) => setData(e.target.value)} required /></label>
              <label className="text-sm">Horário desejado<input id="campo-horario" className={fieldClass} type="time" min="08:00" max="22:00" step="60" value={horario} onChange={(e) => setHorario(e.target.value)} required /><span className="mt-1 block text-xs text-[#686868]">Escolha o horário exato desejado, entre 08h e 22h.</span></label>
              <p className="flex gap-2 text-xs leading-relaxed text-[#686868] md:col-span-2"><CalendarDays size={16} className="shrink-0 text-[#941b25]"/> A data e o horário são uma preferência. Nossa equipe confirmará a disponibilidade pelo WhatsApp antes de concluir o pedido.</p>
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#941b25] text-white font-semibold">4</span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#941b25]">Pagamento</p><h2 className="mt-1 text-2xl md:text-3xl">Como prefere pagar?</h2></div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Pix","Cartão de crédito","Cartão de débito"].map((metodo) => <button type="button" key={metodo} onClick={() => setPagamento(metodo)} className={`rounded-lg border p-5 text-left transition ${pagamento === metodo ? "border-[#941b25] bg-[#941b25]/[0.06] ring-1 ring-[#941b25]" : "bg-white hover:border-[#941b25]/60"}`}><span className="flex items-center justify-between font-semibold">{metodo}{pagamento === metodo && <CheckCircle2 size={18} className="text-[#941b25]"/>}</span><span className="mt-1 block text-xs text-[#686868]">{metodo === "Pix" ? "Pagamento via Pix" : metodo === "Cartão de débito" ? "Pagamento à vista no débito" : "Pagamento à vista ou parcelado"}</span></button>)}
            </div>
            {pagamento === "Cartão de crédito" && <div className="mt-4 rounded-lg border border-[#deded9] bg-white p-5">
              <p className="text-sm font-semibold">Escolha a condição de pagamento</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {["Crédito à vista","Até 3x"].map((condicao) => <button type="button" key={condicao} onClick={() => setCondicaoCartao(condicao)} className={`rounded-md border p-4 text-left transition ${condicaoCartao === condicao ? "border-[#941b25] bg-[#941b25]/[0.06] ring-1 ring-[#941b25]" : "border-[#deded9] hover:border-[#941b25]/60"}`}><span className="flex items-center justify-between text-sm font-semibold">{condicao}{condicaoCartao === condicao && <CheckCircle2 size={17} className="text-[#941b25]"/>}</span><span className="mt-1 block text-xs text-[#686868]">{condicao === "Crédito à vista" ? "Sem parcelamento" : "Com acréscimo da máquina"}</span></button>)}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#686868]">No parcelamento em até 3x, será aplicado o acréscimo da máquina de cartão. O valor final será informado pela equipe.</p>
            </div>}
            <label className="mt-4 block text-sm">Observações <span className="text-[#686868]">(opcional)</span><textarea className={fieldClass} rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Alguma informação importante sobre seu pedido?"/></label>
            <div className="mt-5 rounded-lg border border-[#deded9] bg-white p-4">
              <p className="text-sm font-semibold">Verificação de segurança</p>
              {turnstileSiteKey ? (
                <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-[#686868]">A verificação de segurança está sendo configurada. O envio ficará disponível assim que a equipe concluir essa etapa.</p>
              )}
            </div>
          </div>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-lg border border-[#941b25]/50 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2"><ShoppingBag size={18} className="text-[#941b25]"/><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#941b25]">Resumo do pedido</p></div>
            <div className="mt-5 space-y-3">
              {itens.map((item, i) => {
                const p = CATALOGO.find((produto) => produto.nome === item.sabor)!;
                const preco = item.tamanho === 30 ? p.p30 : p.p50;
                return <div key={i} className="flex justify-between gap-3 text-sm"><span className="text-[#686868]">{item.quantidade}x {item.sabor} {item.tamanho}L</span><strong className="whitespace-nowrap">{money(preco * item.quantidade)}</strong></div>;
              })}
            </div>
            <div className="mt-6 rounded-lg border border-[#deded9] bg-[#fafaf8] p-4">
              <p className="text-sm font-semibold">Cupom de desconto</p>
              <div className="mt-2 flex gap-2">
                <input aria-label="Código do cupom" className={`${fieldClass} mt-0 min-w-0 flex-1`} value={cupomDigitado} onChange={(e) => { setCupomDigitado(e.target.value.toUpperCase()); setCupomAplicado(false); setMensagemCupom(""); }} placeholder="Digite seu cupom" maxLength={30} />
                <button type="button" onClick={aplicarCupom} className="shrink-0 rounded-md bg-[#941b25] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#76151d]">Aplicar</button>
              </div>
              {mensagemCupom && <p role="status" className={`mt-2 text-xs ${cupomAplicado ? "text-green-700" : "text-red-600"}`}>{mensagemCupom}</p>}
            </div>
            <div className="mt-5 space-y-2 border-t pt-5 text-sm">
              <div className="flex justify-between"><span className="text-[#686868]">Total dos produtos</span><strong>{money(total)}</strong></div>
              {cupomAplicado && <div className="flex justify-between text-green-700"><span>Desconto AGNES10 (10% no Agnes 08 Zero Glúten)</span><strong>− {money(desconto)}</strong></div>}
              <div className="flex items-end justify-between border-t pt-3"><span className="font-semibold">Total a pagar</span><strong className="text-2xl text-[#941b25]">{money(totalComDesconto)}</strong></div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#686868]">Valor dos barris com chopeira elétrica e kit de extração inclusos. A equipe confirmará a entrega e as condições finais pelo WhatsApp.</p>
            {erroEnvio && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erroEnvio}</p>}
            <button type="button" onClick={() => void enviarPedido()} disabled={enviando || !areaLiberada || !turnstileSiteKey || !turnstileToken} className="pedidos-whatsapp-neon mt-6 inline-flex w-full items-center justify-center rounded-md bg-[#941b25] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#76151d] disabled:cursor-wait disabled:opacity-60">{enviando ? "Registrando pedido..." : "Enviar pedido pelo WhatsApp"}</button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[#686868]">Você ainda poderá revisar as informações antes de enviar a mensagem.</p>
          </div>
          <div className="mt-4 rounded-lg border p-5 text-sm text-[#686868]"><p className="font-semibold text-[#171717]">Atendemos Teresina, Timon e região.</p><p className="mt-1">A entrega será confirmada pela nossa equipe.</p></div>
        </aside>
        </div>
      </section>
    </>
  );
}
