import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Check } from "lucide-react";
import { PageHero } from "@/components/Layout";
import { whatsappLink } from "@/lib/site";
import barris from "@/assets/barris.jpg";

export const Route = createFileRoute("/barris")({
  head: () => ({
    meta: [
      { title: "Barris de chopp — HERR AGNES" },
      { name: "description", content: "Barris de 30L e 50L com chopeira para eventos em Teresina." },
      { property: "og:title", content: "Barris HERR AGNES" },
      { property: "og:description", content: "Barris de 30L e 50L para sua festa." },
    ],
  }),
  component: Barris,
});

const OPCOES = [
  { l: 30, ideal: "Até 30 convidados", itens: ["Chopeira inclusa", "Entrega e recolhimento", "Ideal para aniversários"] },
  { l: 50, ideal: "De 30 a 60 convidados", itens: ["Chopeira inclusa", "Entrega e recolhimento", "Ideal para casamentos e eventos"] },
];

function Barris() {
  return (
    <>
      <PageHero eyebrow="Barris" title="O tamanho certo para seu evento" />
      <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 md:grid-cols-[1.1fr_1fr]">
        <img src={barris} alt="Barris de chopp em aço inox" loading="lazy" width={1200} height={912} className="h-full rounded-lg object-cover" />
        <div className="space-y-5">
          {OPCOES.map((o) => (
            <div key={o.l} className="rounded-lg border bg-card p-7">
              <h2 className="text-4xl">Barril {o.l}L</h2>
              <p className="mt-1 text-sm text-gold">{o.ideal}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {o.itens.map((i) => <li key={i} className="flex gap-2"><Check size={16} className="text-primary" />{i}</li>)}
              </ul>
              <a href={whatsappLink(`Olá! Quero orçamento de um barril de ${o.l}L.`)} target="_blank" rel="noreferrer" className="btn-outline-gold mt-6">
                <MessageCircle size={16} /> Orçar barril {o.l}L
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
