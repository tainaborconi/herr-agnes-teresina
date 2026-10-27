import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { PageHero } from "@/components/Layout";
import {
  OBS_CALCULADORA,
  MAX_CONVIDADOS_TABELA,
  DURACOES,
  DURACAO_PADRAO,
  calcularLitros,
  sugerirBarris,
  whatsappLink,
} from "@/lib/site";

export const Route = createFileRoute("/calculadora")({
  head: () => ({
    meta: [
      { title: "Calcule seu chopp — HERR AGNES" },
      { name: "description", content: "Descubra quantos litros de chopp e quais barris sua festa precisa, conforme os convidados e a duração da festa." },
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
  const litros = calcularLitros(pessoas, horas);
  const b = sugerirBarris(litros);
  const barrisTxt = [b.b50 && `${b.b50} barril(is) de 50L`, b.b30 && `${b.b30} barril(is) de 30L`].filter(Boolean).join(" + ");
  const durTxt = DURACOES.find((d) => d.h === horas)?.rotulo ?? `${horas} horas`;
  const msg = `Olá! Calculei no site: ${pessoas} convidados, festa de ${durTxt}. Estimativa de ${litros}L de chopp (${barrisTxt}). Gostaria de um orçamento.`;

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
