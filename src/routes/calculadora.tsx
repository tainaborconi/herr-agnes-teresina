import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { PageHero } from "@/components/Layout";
import { calcularLitros, sugerirBarris, whatsappLink, SABORES, type Perfil } from "@/lib/site";

export const Route = createFileRoute("/calculadora")({
  head: () => ({
    meta: [
      { title: "Calcule seu chopp — HERR AGNES" },
      { name: "description", content: "Descubra quantos litros de chopp e quais barris sua festa precisa." },
      { property: "og:title", content: "Calculadora de chopp HERR AGNES" },
      { property: "og:description", content: "Quantos litros sua festa precisa? Calcule em segundos." },
    ],
  }),
  component: Calc,
});

const field = "mt-2 w-full rounded-md border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Calc() {
  const [pessoas, setPessoas] = useState(50);
  const [horas, setHoras] = useState(5);
  const [perfil, setPerfil] = useState<Perfil>("moderado");
  const [sabor, setSabor] = useState(SABORES[0].nome);
  const litros = calcularLitros(pessoas, horas, perfil);
  const b = sugerirBarris(litros);
  const barrisTxt = [b.b50 && `${b.b50} barril(is) de 50L`, b.b30 && `${b.b30} barril(is) de 30L`].filter(Boolean).join(" + ");
  const msg = `Olá! Calculei no site: ${pessoas} pessoas, ${horas}h de festa, consumo ${perfil}. Estimativa de ${litros}L de chopp ${sabor} (${barrisTxt}). Gostaria de um orçamento.`;

  return (
    <>
      <PageHero eyebrow="Calcule seu chopp" title="Quanto chopp sua festa precisa?" text="Conte apenas os convidados que bebem. A estimativa é uma referência; confirmamos tudo no orçamento." />
      <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 md:grid-cols-2">
        <div className="space-y-5 rounded-lg border bg-card p-7">
          <label className="block text-sm">Convidados que bebem
            <input type="number" min={1} value={pessoas} onChange={(e) => setPessoas(Math.max(0, +e.target.value))} className={field} />
          </label>
          <label className="block text-sm">Duração da festa (horas)
            <input type="number" min={1} max={24} value={horas} onChange={(e) => setHoras(Math.max(0, +e.target.value))} className={field} />
          </label>
          <label className="block text-sm">Perfil de consumo
            <select value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)} className={field}>
              <option value="leve">Leve (0,4L por pessoa/hora)</option>
              <option value="moderado">Moderado (0,6L por pessoa/hora)</option>
              <option value="intenso">Intenso (0,8L por pessoa/hora)</option>
            </select>
          </label>
          <label className="block text-sm">Sabor
            <select value={sabor} onChange={(e) => setSabor(e.target.value)} className={field}>
              {SABORES.map((s) => <option key={s.nome}>{s.nome}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-col justify-between rounded-lg border border-primary/40 bg-card p-7">
          <div>
            <p className="eyebrow">Sua estimativa</p>
            <p className="mt-4 font-display text-7xl text-gold">{litros}<span className="text-3xl"> litros</span></p>
            <p className="mt-4 text-muted-foreground">{litros > 0 ? `Sugestão: ${barrisTxt} (${b.total}L).` : "Preencha os campos ao lado."}</p>
          </div>
          <a href={whatsappLink(msg)} target="_blank" rel="noreferrer" className="btn-gold mt-8 w-fit">
            <MessageCircle size={16} /> Enviar orçamento no WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
