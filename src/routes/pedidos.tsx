import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import {
  Beer,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Minus,
  MessageCircle,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Faça seu pedido — HERR AGNES" },
      {
        name: "description",
        content:
          "Escolha seu chopp HERR AGNES, monte seu pedido de barris de 30L ou 50L e solicite a entrega em Teresina, Timon e região.",
      },
    ],
  }),
  component: Pedidos,
});

type Volume = 30 | 50;
type Produto = {
  id: string;
  nome: string;
  descricao: string;
  preco30: number;
  preco50: number;
  selo?: string;
};
type ItemCarrinho = {
  key: string;
  produto: Produto;
  volume: Volume;
  quantidade: number;
};

const PRODUTOS: Produto[] = [
  { id: "pilsen", nome: "Pilsen", descricao: "Leve, dourado e refrescante.", preco30: 499, preco50: 779 },
  { id: "puro-malte", nome: "Puro Malte", descricao: "Corpo e equilíbrio para bons momentos.", preco30: 565, preco50: 889 },
  { id: "zero-gluten", nome: "Agnes 08 Zero Glúten", descricao: "Sabor intenso, sem glúten.", preco30: 575, preco50: 899, selo: "Zero glúten" },
  { id: "ipa", nome: "IPA", descricao: "Amargor marcante e aroma intenso.", preco30: 669, preco50: 1099 },
  { id: "munich", nome: "Munich", descricao: "Aromática, maltada e especial.", preco30: 649, preco50: 1059 },
  { id: "red-wein", nome: "Red Wein", descricao: "Aromas intensos e notas frutadas.", preco30: 669, preco50: 1099 },
];

const formatarPreco = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Pedidos() {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [volumes, setVolumes] = useState<Record<string, Volume>>(
    Object.fromEntries(PRODUTOS.map((produto) => [produto.id, 30])),
  );
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    cep: "",
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    data: "",
    horario: "",
    pagamento: "PIX",
    observacoes: "",
  });

  const [cepStatus, setCepStatus] = useState<"idle" | "checking" | "valid" | "outside" | "error">("idle");
  const entregaPermitida =
    cepStatus === "valid" &&
    ((form.cidade.toUpperCase() === "TERESINA" && form.estado === "PI") ||
      (form.cidade.toUpperCase() === "TIMON" && form.estado === "MA"));

  async function consultarCep(cepInformado: string) {
    const cep = cepInformado.replace(/[^0-9]/g, "");
    if (cep.length !== 8) {
      setCepStatus("idle");
      setForm((atual) => ({ ...atual, cidade: "", estado: "" }));
      return;
    }

    setCepStatus("checking");
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!resposta.ok) throw new Error("Falha ao consultar CEP");
      const dados = await resposta.json();
      if (dados.erro) {
        setCepStatus("error");
        setForm((atual) => ({ ...atual, cidade: "", estado: "" }));
        return;
      }

      const cidade = String(dados.localidade ?? "").trim();
      const estado = String(dados.uf ?? "").trim().toUpperCase();
      setForm((atual) => ({ ...atual, cep, cidade, estado }));
      const cidadeNormalizada = cidade.toUpperCase();
      setCepStatus(
        (cidadeNormalizada === "TERESINA" && estado === "PI") ||
          (cidadeNormalizada === "TIMON" && estado === "MA")
          ? "valid"
          : "outside",
      );
    } catch {
      setCepStatus("error");
      setForm((atual) => ({ ...atual, cidade: "", estado: "" }));
    }
  }

  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  const total = useMemo(
    () =>
      carrinho.reduce(
        (soma, item) =>
          soma + (item.volume === 30 ? item.produto.preco30 : item.produto.preco50) * item.quantidade,
        0,
      ),
    [carrinho],
  );

  function adicionar(produto: Produto) {
    const volume = volumes[produto.id];
    const key = `${produto.id}-${volume}`;
    setCarrinho((itens) => {
      const existente = itens.find((item) => item.key === key);
      if (existente) {
        return itens.map((item) =>
          item.key === key ? { ...item, quantidade: item.quantidade + 1 } : item,
        );
      }
      return [...itens, { key, produto, volume, quantidade: 1 }];
    });
  }

  function alterarQuantidade(key: string, delta: number) {
    setCarrinho((itens) =>
      itens
        .map((item) =>
          item.key === key ? { ...item, quantidade: item.quantidade + delta } : item,
        )
        .filter((item) => item.quantidade > 0),
    );
  }

  function enviarPedido(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!carrinho.length || !entregaPermitida) return;

    const lista = carrinho
      .map((item) => {
        const preco = item.volume === 30 ? item.produto.preco30 : item.produto.preco50;
        return `• ${item.quantidade}x ${item.produto.nome} — barril ${item.volume}L (${formatarPreco(preco)} cada)`;
      })
      .join("\n");

    const mensagem = [
      "🍺 *NOVO PEDIDO — HERR AGNES*",
      "",
      "*Itens do pedido:*",
      lista,
      "",
      `*Total dos produtos: ${formatarPreco(total)}*`,
      "",
      "*Dados para entrega:*",
      `Nome: ${form.nome}`,
      `WhatsApp: ${form.telefone}`,
      `Endereço: ${form.endereco}`,
      `Bairro: ${form.bairro}`,
      `CEP: ${form.cep}`,
      `Cidade: ${form.cidade} – ${form.estado}`,
      `Data desejada: ${form.data}`,
      `Horário desejado: ${form.horario}`,
      `Pagamento: ${form.pagamento}`,
      form.observacoes ? `Observações: ${form.observacoes}` : "",
      "",
      "Por favor, confirme a disponibilidade, a entrega e as condições do pedido.",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(whatsappLink(mensagem), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen">
      <section className="section-wine border-b">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="eyebrow">Pedido online · HERR AGNES</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl md:text-6xl">
            Seu chopp. Seu momento. <span className="text-gold">Do seu jeito.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Escolha os barris, monte seu pedido e envie tudo pelo WhatsApp. Nossa equipe confirma
            manualmente a disponibilidade e o agendamento.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Truck size={17} className="text-gold" /> Teresina, Timon e região</span>
            <span className="flex items-center gap-2"><CalendarDays size={17} className="text-gold" /> Entrega mediante confirmação</span>
            <span className="flex items-center gap-2"><CreditCard size={17} className="text-gold" /> PIX e cartões</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Escolha seu chopp</h2>
            <p className="mt-2 text-sm text-muted-foreground">Selecione o volume e adicione ao carrinho.</p>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-card px-4 py-3 text-sm">
            <ShoppingCart size={17} className="text-gold" />
            <span>{totalItens} {totalItens === 1 ? "barril" : "barris"} no pedido</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUTOS.map((produto) => (
            <article key={produto.id} className="flex flex-col rounded-lg border bg-card p-5 transition-colors hover:border-gold/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {produto.selo && <span className="mb-2 inline-block rounded-sm border border-gold/50 px-2 py-1 text-[10px] uppercase tracking-wider text-gold">{produto.selo}</span>}
                  <h3 className="text-2xl">{produto.nome}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{produto.descricao}</p>
                </div>
                <span className="rounded-full border border-gold/40 p-2 text-gold"><Beer size={20} /></span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {([30, 50] as Volume[]).map((volume) => {
                  const preco = volume === 30 ? produto.preco30 : produto.preco50;
                  const selecionado = volumes[produto.id] === volume;
                  return (
                    <button
                      key={volume}
                      type="button"
                      aria-pressed={selecionado}
                      onClick={() => setVolumes((atual) => ({ ...atual, [produto.id]: volume }))}
                      className={selecionado ? "rounded-md border border-gold bg-wine px-3 py-3 text-left" : "rounded-md border bg-secondary px-3 py-3 text-left hover:border-gold/50"}
                    >
                      <span className="block text-xs text-muted-foreground">Barril {volume}L</span>
                      <span className="mt-1 block font-semibold">{formatarPreco(preco)}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => adicionar(produto)} className="btn-gold mt-4 w-full justify-center">
                <Plus size={17} /> Adicionar ao pedido
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section-wine border-y">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[0.9fr_1.1fr] md:py-16">
          <div>
            <p className="eyebrow">Seu carrinho</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Confira seu pedido</h2>
            <p className="mt-3 text-sm text-muted-foreground">Revise os volumes e quantidades antes de continuar.</p>

            <div className="mt-6 space-y-3">
              {carrinho.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Seu carrinho está vazio. Adicione um barril do catálogo para começar.
                </div>
              ) : (
                carrinho.map((item) => {
                  const preco = item.volume === 30 ? item.produto.preco30 : item.produto.preco50;
                  return (
                    <div key={item.key} className="rounded-lg border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.produto.nome}</p>
                          <p className="text-xs text-muted-foreground">Barril {item.volume}L · {formatarPreco(preco)} cada</p>
                        </div>
                        <button type="button" aria-label={`Remover ${item.produto.nome} do carrinho`} onClick={() => setCarrinho((atual) => atual.filter((i) => i.key !== item.key))} className="text-muted-foreground hover:text-red-soft">
                          <Trash2 size={17} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button type="button" aria-label="Diminuir quantidade" onClick={() => alterarQuantidade(item.key, -1)} className="rounded border p-1.5 hover:border-gold"><Minus size={14} /></button>
                          <span className="min-w-4 text-center text-sm">{item.quantidade}</span>
                          <button type="button" aria-label="Aumentar quantidade" onClick={() => alterarQuantidade(item.key, 1)} className="rounded border p-1.5 hover:border-gold"><Plus size={14} /></button>
                        </div>
                        <span className="font-semibold">{formatarPreco(preco * item.quantidade)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-gold/30 pt-4">
              <span className="text-sm text-muted-foreground">Total dos produtos</span>
              <span className="text-2xl font-semibold text-gold">{formatarPreco(total)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Taxas de entrega ou condições especiais, se houver, serão confirmadas pela equipe.</p>
          </div>

          <div>
            <p className="eyebrow">Finalização</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Dados para entrega</h2>
            <p className="mt-3 text-sm text-muted-foreground">Preencha os dados para enviar seu pedido ao WhatsApp.</p>

            <form onSubmit={enviarPedido} className="mt-6 space-y-4 rounded-lg border bg-card p-5 md:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">Nome completo
                  <input required autoComplete="name" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" className="mt-2 w-full rounded-md border bg-secondary px-3 py-2.5" />
                </label>
                <label className="block text-sm">WhatsApp
                  <input required type="tel" autoComplete="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(86) 99999-9999" className="mt-2 w-full rounded-md border bg-secondary px-3 py-2.5" />
                </label>
              </div>
              <label className="block text-sm">CEP de entrega
                <input
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={9}
                  value={form.cep}
                  onChange={(e) => {
                    const cep = e.target.value;
                    setForm((atual) => ({ ...atual, cep, cidade: "", estado: "" }));
                    setCepStatus("idle");
                  }}
                  onBlur={() => void consultarCep(form.cep)}
                  placeholder="64000-000"
                  className="mt-2 w-full rounded-md border bg-secondary px-3 py-2.5"
                />
                <span className="mt-1 block text-xs text-muted-foreground">Consultamos o CEP para confirmar se o endereço está na nossa área de entrega.</span>
              </label>
              {cepStatus === "checking" && <p role="status" className="text-sm text-muted-foreground">Consultando CEP...</p>}
              {cepStatus === "valid" && (
                <p role="status" className="rounded-md border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm text-green-700">
                  Entrega disponível em {form.cidade} – {form.estado}. Você pode continuar.
                </p>
              )}
              {cepStatus === "outside" && (
                <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Ainda não atendemos esse endereço. No momento, entregamos somente em Teresina (PI) e Timon (MA).
                </p>
              )}
              {cepStatus === "error" && (
                <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Não conseguimos localizar esse CEP. Confira os números e tente novamente.
                </p>
              )}
              <label className="block text-sm">Endereço de entrega
                <input required autoComplete="street-address" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número e complemento" className="mt-2 w-full rounded-md border bg-secondary px-3 py-2.5" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">Bairro
                  <input required value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Seu bairro" className="mt-2 w-full rounded-md border bg-secondary px-3 py-2.5" />
                </label>
                <label className="block text-sm">Cidade
                  <input readOnly value={form.cidade ? `${form.cidade} – ${form.estado}` : "Consulte o CEP"} className="mt-2 w-full rounded-md border bg-secondary px-3 py-2.5 text-muted-foreground" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">Data desejada
                  <input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="mt-2 w-full rounded-md border bg-secondary px-3 py-2.5" />
                </label>
                <label className="block text-sm">Horário desejado
                  <input required type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} className="mt-2 w-full rounded-md border bg-secondary px-3 py-2.5" />
                </label>
              </div>
              <label className="block text-sm">Forma de pagamento
                <select value={form.pagamento} onChange={(e) => setForm({ ...form, pagamento: e.target.value })} className="mt-2 w-full rounded-md border bg-secondary px-3 py-2.5">
                  <option>PIX</option>
                  <option>Cartão de crédito</option>
                  <option>Cartão de débito</option>
                </select>
              </label>
              <label className="block text-sm">Observações <span className="text-muted-foreground">(opcional)</span>
                <textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Referência do endereço ou detalhes do pedido" className="mt-2 w-full resize-y rounded-md border bg-secondary px-3 py-2.5" />
              </label>
              <button type="submit" disabled={!carrinho.length || !entregaPermitida} className="btn-gold w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
                <MessageCircle size={18} /> Enviar pedido pelo WhatsApp
              </button>
              <p className="flex items-start gap-2 text-xs text-muted-foreground"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-gold" /> O pedido será enviado para confirmação. Data, horário, disponibilidade e eventuais taxas ainda dependem da equipe HERR AGNES.</p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
