import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/Layout";
import {
  OBS_CALCULADORA,
  MAX_CONVIDADOS_TABELA,
  DURACOES,
  DURACAO_PADRAO,
  SABORES,
  calcularLitros,
  mensagemOrcamento,
  sugerirBarris,
  whatsappLink,
} from "@/lib/site";

export const Route = createFileRoute("/calculadora")({
  head: () => ({
    meta: [
      { title: "Calcule seu chopp — HERR AGNES" },
      { name: "description", content: "Descubra quantos litros de chopp e quais barris sua festa precisa, conforme os convidados e a duração da festa, e envie o orçamento já com o sabor escolhido." },
      { property: "og:title", content: "Calculadora de chopp HERR AGNES" },
      { property: "og:description", content: "Quantos litros sua festa precisa? Calcule em segundos." },
    ],
  }),
  component: Calc,
});

const field = "mt-2 w-full rounded-md border bg-secondary px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Calc() {
  const [pessoas, setPessoas] = useState(50);
  const [horas, setHoras] = useState<number>(DURACAO_PADRAO);
  const [sabores, setSabores] = useState<string[]>([]);
  const litros = calcularLitros(pessoas, horas);
  const b = sugerirBarris(litros);
  const barrisTxt = [b.b50 && `${b.b50} barril(is) de 50L`, b.b30 && `${b.b30} barril(is) de 30L`].filter(Boolean).join(" + ");
  const durTxt = DURACOES.find((d) => d.h === horas)?.rotulo ?? `${horas} horas`;
  const saborTxt = sabores.length ? sabores.join(", ") : "a definir com a Agnes";
  const msg = mensagemOrcamento(pessoas, horas, sabores);

  const alternar = (nome: string) =>
    setSabores((atual) => (atual.includes(nome) ? atual.filter((s) => s !== nome) : [...atual, nome]));

  return (
    <>
      <PageHero eyebrow="Calcule seu chopp" title="Quanto chopp sua festa precisa?" text="Informe o número de convidados e a duração da festa e veja a estimativa de litros e os barris ideais." />
      <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 md:grid-cols-2">
        <div className="space-y-5 rounded-lg border bg-card p-7">
          <label className="block text-sm">Convidados
            <input type="number" min={1} value={pessoas} onChange={(e) => setPessoas(Math.max(0, +e.target.value))} className={field} />
          </label>
          <label className="block text-sm">Duração da festa
            <select value={horas} onChange={(e) => setHoras(+e.target.value)} className={field}>
              {DURACOES.map((d) => (
                <option key={d.h} value={d.h}>{d.rotulo}</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm">Sabor do chopp <span className="text-muted-foreground">(opcional)</span></legend>
            <p className="mt-1 text-xs text-muted-foreground">
              Pode marcar um ou mais. A escolha não muda a quantidade estimada — ela só vai junto no seu pedido de orçamento.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SABORES.map((s) => {
                const ativo = sabores.includes(s.nome);
                return (
                  <button
                    type="button"
                    key={s.nome}
                    aria-pressed={ativo}
                    onClick={() => alternar(s.nome)}
                    className={
                      ativo
                        ? "inline-flex items-center gap-1.5 rounded-md border border-gold bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                        : "inline-flex items-center gap-1.5 rounded-md border bg-secondary px-3 py-2 text-sm text-foreground hover:bg-accent"
                    }
                  >
                    {ativo && <Check size={14} />} {s.nome}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <p className="text-xs text-muted-foreground">
            A estimativa segue a tabela da casa, de 1 a {MAX_CONVIDADOS_TABELA} convidados. Acima disso, ajustamos a quantidade no orçamento.
          </p>
        </div>
        <div className="section-wine flex flex-col justify-between rounded-lg border p-7">
          <div>
            <p className="eyebrow">Sua estimativa</p>
            <p className="mt-4 font-display text-7xl text-gold">{litros}<span className="text-3xl"> litros</span></p>
            <p className="mt-4 text-muted-foreground">
              {litros > 0 ? `Para ${pessoas} convidados em uma festa de ${durTxt}: ${barrisTxt} (${b.total}L).` : "Informe o número de convidados."}
            </p>
            <p className="mt-2 text-muted-foreground">
              <span className="font-semibold text-gold">Sabores:</span> {saborTxt}
            </p>
          </div>
          <div className="mt-8">
            <p className="rounded-md border border-gold/50 bg-secondary p-4 text-sm leading-relaxed text-foreground">
              <span className="font-semibold text-gold">Observação:</span> {OBS_CALCULADORA}
            </p>
            <a href={whatsappLink(msg)} target="_blank" rel="noreferrer" className="btn-gold mt-6 w-fit">
              <MessageCircle size={16} /> Enviar orçamento no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
