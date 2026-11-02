import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronDown, Minus, Plus, ShoppingBag } from "lucide-react";
import { whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Faça seu pedido — HERR AGNES" },
      { name: "description", content: "Escolha seu chopp, tamanho do barril e agende sua entrega com a HERR AGNES." },
    ],
  }),
  component: Pedidos,
});

const CATALOGO = [
  { nome: "Pilsen", p30: 499, p50: 779, descricao: "Leve, dourado e refrescante." },
  { nome: "Puro Malte", p30: 565, p50: 889, descricao: "Encorpado e equilibrado." },
  { nome: "Agnes 08 Zero Glúten", p30: 575, p50: 899, descricao: "Todo o sabor, sem glúten." },
  { nome: "IPA", p30: 669, p50: 1099, descricao: "Aromático e com amargor marcante." },
  { nome: "Munich", p30: 649, p50: 1059, descricao: "Maltado, intenso e especial." },
  { nome: "Red Wein (Chopp de Vinho)", p30: 669, p50: 1099, descricao: "Suave e frutado." },
];

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fieldClass = "mt-2 w-full rounded-md border border-[#d7d7d2] bg-white px-3 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#92928d] focus:border-[#941b25] focus:ring-2 focus:ring-[#941b25]/15";

type Item = { sabor: string; tamanho: 30 | 50; quantidade: number };

function Pedidos() {
  const [itens, setItens] = useState<Item[]>([{ sabor: "Pilsen", tamanho: 30, quantidade: 1 }]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [referencia, setReferencia] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [pagamento, setPagamento] = useState("Pix");
  const [condicaoCartao, setCondicaoCartao] = useState("Crédito à vista");
  const [observacoes, setObservacoes] = useState("");

  const total = useMemo(() => itens.reduce((sum, item) => {
    const produto = CATALOGO.find((p) => p.nome === item.sabor)!;
    return sum + (item.tamanho === 30 ? produto.p30 : produto.p50) * item.quantidade;
  }, 0), [itens]);

  const atualizarItem = (index: number, patch: Partial<Item>) => setItens((atual) => atual.map((item, i) => i === index ? { ...item, ...patch } : item));
  const adicionarItem = () => setItens((atual) => [...atual, { sabor: "Pilsen", tamanho: 30, quantidade: 1 }]);
  const removerItem = (index: number) => setItens((atual) => atual.length > 1 ? atual.filter((_, i) => i !== index) : atual);

  const enviarPedido = () => {
    const numeroPedido = Math.floor(Math.random() * 949) + 51;
    const dataFormatada = data ? new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR") : data;
    const formaPagamento = pagamento === "Cartão de crédito" ? "Cartão de crédito — " + condicaoCartao + (condicaoCartao === "Até 3x" ? " (com acréscimo da máquina)" : "") : pagamento;
    const linhas = itens.map((item, i) => {
      const p = CATALOGO.find((produto) => produto.nome === item.sabor)!;
      const preco = item.tamanho === 30 ? p.p30 : p.p50;
      return `${i + 1}. ${item.sabor} — barril ${item.tamanho}L — ${item.quantidade}x — ${money(preco * item.quantidade)}`;
    }).join("\n");
    const mensagem = [
      `Olá, equipe HERR AGNES! Tenho interesse em realizar o pedido abaixo.`,
      "",
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
      referencia ? `📌 Referência: ${referencia}` : "",
      "",
      "*ITENS DO PEDIDO*",
      linhas,
      "",
      `💰 *TOTAL DO PEDIDO: ${money(total)}*`,
      "",
      "*ENTREGA*",
      `📅 Data desejada: ${dataFormatada}`,
      `🕒 Horário desejado: ${horario}`,
      "",
      "*PAGAMENTO*",
      `💳 Forma de pagamento: ${formaPagamento}`,
      observacoes ? `📝 Observações: ${observacoes}` : "",
      "",
      "A data, o horário e as condições de entrega estão sujeitos à confirmação da equipe HERR AGNES."
    ].filter(Boolean).join("\n");
    window.open(whatsappLink(mensagem), "_blank", "noopener,noreferrer");
  };

  const formularioValido = Boolean(nome.trim() && telefone.trim() && endereco.trim() && referencia.trim() && data && horario && itens.length > 0);

  return (
    <>
      <section className="border-b border-[#e5e5e0] bg-[#f7f7f5] text-[#171717]">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="max-w-2xl text-sm leading-relaxed text-[#686868] md:text-base">Monte seu pedido em poucos passos. Escolha os sabores, informe onde e quando deseja receber e envie tudo pelo WhatsApp. É rápido e fácil!</p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs text-[#686868]">
            <span className="rounded-full border px-4 py-2">30L e 50L</span>
            <span className="rounded-full border px-4 py-2">Chopeira elétrica inclusa</span>
            <span className="rounded-full border px-4 py-2">Confirmação pela equipe</span>
          </div>
        </div>
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
                          <span className="block text-lg font-bold">{size} litros</span><span className="mt-1 block text-sm text-[#941b25]">{money(price)}</span>
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
            <div className="grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-2 md:p-6">
              <label className="text-sm">Nome completo<input className={fieldClass} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos chamar você?" autoComplete="name" required /></label>
              <label className="text-sm">WhatsApp<input className={fieldClass} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel" required /></label>
              <label className="text-sm md:col-span-2">Endereço completo<input className={fieldClass} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro e cidade" autoComplete="street-address" required /></label>
              <label className="text-sm md:col-span-2">Ponto de referência <span className="text-[#686868]">(opcional)</span><input className={fieldClass} value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ex.: próximo à praça..." /></label>
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#941b25] text-white font-semibold">3</span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#941b25]">Agendamento</p><h2 className="mt-1 text-2xl md:text-3xl">Quando deseja receber?</h2></div></div>
            <div className="grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-2 md:p-6">
              <label className="text-sm">Data desejada<input className={fieldClass} type="date" min={new Date().toLocaleDateString("en-CA")} value={data} onChange={(e) => setData(e.target.value)} required /></label>
              <label className="text-sm">Horário desejado<input className={fieldClass} type="time" min="08:00" max="22:00" step="60" value={horario} onChange={(e) => setHorario(e.target.value)} required /><span className="mt-1 block text-xs text-[#686868]">Escolha o horário exato desejado, entre 08h e 22h.</span></label>
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
          </div>
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
            <div className="mt-5 flex items-end justify-between border-t pt-5"><span className="text-sm text-[#686868]">Total dos produtos</span><strong className="text-2xl text-[#941b25]">{money(total)}</strong></div>
            <p className="mt-3 text-xs leading-relaxed text-[#686868]">Valor dos barris com chopeira elétrica e kit de extração inclusos. A equipe confirmará a entrega e as condições finais pelo WhatsApp.</p>
            <button type="button" disabled={!formularioValido} onClick={enviarPedido} className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-[#941b25] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#76151d] disabled:cursor-not-allowed disabled:opacity-40">Enviar pedido pelo WhatsApp</button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[#686868]">Você ainda poderá revisar as informações antes de enviar a mensagem.</p>
          </div>
          <div className="mt-4 rounded-lg border p-5 text-sm text-[#686868]"><p className="font-semibold text-[#171717]">Atendemos Teresina, Timon e região.</p><p className="mt-1">A entrega será confirmada pela nossa equipe.</p></div>
        </aside>
        </div>
      </section>
    </>
  );
}
