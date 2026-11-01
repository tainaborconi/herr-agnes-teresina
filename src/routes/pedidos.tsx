import { createFileRoute, Link } from "@tanstack/react-router";
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
const fieldClass = "mt-2 w-full rounded-md border border-input bg-secondary px-3 py-3 text-sm text-foreground outline-none transition focus:border-red-soft focus:ring-2 focus:ring-red-soft/20";

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
  const [observacoes, setObservacoes] = useState("");

  const total = useMemo(() => itens.reduce((sum, item) => {
    const produto = CATALOGO.find((p) => p.nome === item.sabor)!;
    return sum + (item.tamanho === 30 ? produto.p30 : produto.p50) * item.quantidade;
  }, 0), [itens]);

  const atualizarItem = (index: number, patch: Partial<Item>) => setItens((atual) => atual.map((item, i) => i === index ? { ...item, ...patch } : item));
  const adicionarItem = () => setItens((atual) => [...atual, { sabor: "Pilsen", tamanho: 30, quantidade: 1 }]);
  const removerItem = (index: number) => setItens((atual) => atual.length > 1 ? atual.filter((_, i) => i !== index) : atual);

  const enviarPedido = () => {
    const linhas = itens.map((item, i) => {
      const p = CATALOGO.find((produto) => produto.nome === item.sabor)!;
      const preco = item.tamanho === 30 ? p.p30 : p.p50;
      return `${i + 1}. ${item.sabor} — barril ${item.tamanho}L — ${item.quantidade}x — ${money(preco * item.quantidade)}`;
    }).join("\n");
    const mensagem = [
      "Olá! Quero fazer um pedido pelo site da HERR AGNES.",
      "",
      " *MEU PEDIDO*",
      linhas,
      `Total dos produtos: ${money(total)}`,
      "",
      " *DADOS PARA ENTREGA*",
      `Nome: ${nome}`,
      `Telefone: ${telefone}`,
      `Endereço: ${endereco}`,
      referencia ? `Referência: ${referencia}` : "",
      `Data desejada: ${data}`,
      `Horário desejado: ${horario}`,
      `Pagamento: ${pagamento}`,
      observacoes ? `Observações: ${observacoes}` : "",
      "",
      "Sei que a data e o horário serão confirmados pela equipe."
    ].filter(Boolean).join("\n");
    window.open(whatsappLink(mensagem), "_blank", "noopener,noreferrer");
  };

  const formularioValido = Boolean(nome.trim() && telefone.trim() && endereco.trim() && data && horario && itens.length > 0);

  return (
    <>
      <section className="section-wine border-b">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="eyebrow">Pedido online</p>
          <h1 className="mt-3 max-w-3xl text-5xl leading-tight md:text-6xl">Seu chopp. Sua festa. <span className="text-gold">Do seu jeito.</span></h1>
          <p className="mt-5 max-w-2xl text-sm text-muted-foreground md:text-base">Monte seu pedido em poucos passos. Escolha os sabores, informe onde e quando deseja receber e envie tudo pelo WhatsApp.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border px-4 py-2">30L e 50L</span>
            <span className="rounded-full border px-4 py-2">Chopeira elétrica inclusa</span>
            <span className="rounded-full border px-4 py-2">Confirmação pela equipe</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.5fr_0.8fr] lg:py-16">
        <div className="space-y-10">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-semibold">1</span>
              <div><p className="eyebrow">Escolha seus produtos</p><h2 className="mt-1 text-2xl md:text-3xl">Monte seu pedido</h2></div>
            </div>
            <div className="space-y-4">
              {itens.map((item, index) => {
                const produto = CATALOGO.find((p) => p.nome === item.sabor)!;
                const preco = item.tamanho === 30 ? produto.p30 : produto.p50;
                return (
                  <div key={index} className="rounded-lg border bg-card p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-xs text-gold">BARRIL {index + 1}</p><h3 className="mt-1 text-xl">{item.sabor}</h3></div>
                      {itens.length > 1 && <button type="button" onClick={() => removerItem(index)} className="text-xs text-muted-foreground underline hover:text-foreground">Remover</button>}
                    </div>
                    <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sabor</label>
                    <div className="relative">
                      <select className={fieldClass} value={item.sabor} onChange={(e) => atualizarItem(index, { sabor: e.target.value })}>
                        {CATALOGO.map((p) => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-5 text-muted-foreground" size={16} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{produto.descricao}</p>
                    <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tamanho do barril</label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {([30, 50] as const).map((size) => {
                        const price = size === 30 ? produto.p30 : produto.p50;
                        return <button type="button" key={size} onClick={() => atualizarItem(index, { tamanho: size })} className={`rounded-md border p-4 text-left transition ${item.tamanho === size ? "border-red-soft bg-primary/15 ring-1 ring-red-soft" : "border-border bg-secondary hover:border-red-soft/60"}`}>
                          <span className="block text-lg font-bold">{size} litros</span><span className="mt-1 block text-sm text-gold">{money(price)}</span>
                        </button>;
                      })}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Quantidade</span>
                      <div className="flex items-center gap-4">
                        <button type="button" aria-label="Diminuir quantidade" onClick={() => atualizarItem(index, { quantidade: Math.max(1, item.quantidade - 1) })} className="rounded-full border p-2 hover:bg-secondary"><Minus size={15}/></button>
                        <span className="min-w-4 text-center font-semibold">{item.quantidade}</span>
                        <button type="button" aria-label="Aumentar quantidade" onClick={() => atualizarItem(index, { quantidade: Math.min(20, item.quantidade + 1) })} className="rounded-full border p-2 hover:bg-secondary"><Plus size={15}/></button>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between border-t pt-4 text-sm"><span className="text-muted-foreground">Subtotal deste item</span><strong className="text-gold">{money(preco * item.quantidade)}</strong></div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={adicionarItem} className="btn-outline-gold mt-4"><Plus size={16}/> Adicionar outro barril</button>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Todos os pedidos incluem barril lacrado, chopeira elétrica e kit de extração.</p>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-semibold">2</span><div><p className="eyebrow">Seus dados</p><h2 className="mt-1 text-2xl md:text-3xl">Onde vamos entregar?</h2></div></div>
            <div className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-2 md:p-6">
              <label className="text-sm">Nome completo<input className={fieldClass} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos chamar você?" autoComplete="name" required /></label>
              <label className="text-sm">WhatsApp<input className={fieldClass} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel" required /></label>
              <label className="text-sm md:col-span-2">Endereço completo<input className={fieldClass} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro e cidade" autoComplete="street-address" required /></label>
              <label className="text-sm md:col-span-2">Ponto de referência <span className="text-muted-foreground">(opcional)</span><input className={fieldClass} value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ex.: próximo à praça..." /></label>
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-semibold">3</span><div><p className="eyebrow">Agendamento</p><h2 className="mt-1 text-2xl md:text-3xl">Quando deseja receber?</h2></div></div>
            <div className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-2 md:p-6">
              <label className="text-sm">Data desejada<input className={fieldClass} type="date" min={new Date().toLocaleDateString("en-CA")} value={data} onChange={(e) => setData(e.target.value)} required /></label>
              <label className="text-sm">Horário desejado<select className={fieldClass} value={horario} onChange={(e) => setHorario(e.target.value)} required><option value="">Selecione um horário</option>{["08h às 10h","10h às 12h","12h às 14h","14h às 16h","16h às 18h","18h às 20h","20h às 22h"].map((h) => <option key={h}>{h}</option>)}</select></label>
              <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground md:col-span-2"><CalendarDays size={16} className="shrink-0 text-gold"/> A data e o horário são uma preferência. Nossa equipe confirmará a disponibilidade pelo WhatsApp antes de concluir o pedido.</p>
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-semibold">4</span><div><p className="eyebrow">Pagamento</p><h2 className="mt-1 text-2xl md:text-3xl">Como prefere pagar?</h2></div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Pix","Cartão"].map((metodo) => <button type="button" key={metodo} onClick={() => setPagamento(metodo)} className={`rounded-lg border p-5 text-left transition ${pagamento === metodo ? "border-red-soft bg-primary/15 ring-1 ring-red-soft" : "bg-card hover:border-red-soft/60"}`}><span className="flex items-center justify-between font-semibold">{metodo}{pagamento === metodo && <CheckCircle2 size={18} className="text-gold"/>}</span><span className="mt-1 block text-xs text-muted-foreground">{metodo === "Pix" ? "Pagamento via Pix" : "Pagamento com cartão"}</span></button>)}
            </div>
            <label className="mt-4 block text-sm">Observações <span className="text-muted-foreground">(opcional)</span><textarea className={fieldClass} rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Alguma informação importante sobre seu pedido?"/></label>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-lg border border-red-soft/50 bg-card p-6 shadow-xl">
            <div className="flex items-center gap-2"><ShoppingBag size={18} className="text-gold"/><p className="eyebrow">Resumo do pedido</p></div>
            <div className="mt-5 space-y-3">
              {itens.map((item, i) => {
                const p = CATALOGO.find((produto) => produto.nome === item.sabor)!;
                const preco = item.tamanho === 30 ? p.p30 : p.p50;
                return <div key={i} className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{item.quantidade}x {item.sabor} {item.tamanho}L</span><strong className="whitespace-nowrap">{money(preco * item.quantidade)}</strong></div>;
              })}
            </div>
            <div className="mt-5 flex items-end justify-between border-t pt-5"><span className="text-sm text-muted-foreground">Total dos produtos</span><strong className="text-2xl text-gold">{money(total)}</strong></div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Valor dos barris com chopeira elétrica e kit de extração inclusos. A equipe confirmará a entrega e as condições finais pelo WhatsApp.</p>
            <button type="button" disabled={!formularioValido} onClick={enviarPedido} className="btn-gold mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40">Enviar pedido pelo WhatsApp</button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">Você ainda poderá revisar as informações antes de enviar a mensagem.</p>
          </div>
          <div className="mt-4 rounded-lg border p-5 text-sm text-muted-foreground"><p className="font-semibold text-foreground">Atendemos Teresina, Timon e região.</p><p className="mt-1">A entrega será confirmada pela nossa equipe.</p><Link to="/barris" className="mt-3 inline-block text-gold underline underline-offset-4">Conheça os barris</Link></div>
        </aside>
      </section>
    </>
  );
}
