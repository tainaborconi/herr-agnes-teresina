import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Check } from "lucide-react";
import { PageHero } from "@/components/Layout";
import { INCLUSO, whatsappLink } from "@/lib/site";
import barris from "@/assets/barris.jpg";

export const Route = createFileRoute("/barris")({
  head: () => ({
    meta: [
      { title: "Barris de chopp — HERR AGNES" },
      { name: "description", content: "Barris de 30L e 50L com chopeira elétrica, kit de extração e entrega no mesmo dia em Teresina." },
      { property: "og:title", content: "Barris HERR AGNES" },
      { property: "og:description", content: "Barris de 30L e 50L para sua festa." },
    ],
  }),
  component: Barris,
});

const OPCOES = [
  { l: 30, ideal: "Até 30 convidados", itens: ["Barril lacrado", "Chopeira elétrica", "Kit de extração", "Entrega no mesmo dia"] },
  { l: 50, ideal: "De 30 a 60 convidados", itens: ["Barril lacrado", "Chopeira elétrica", "Kit de extração", "Entrega no mesmo dia"] },
];

function Barris() {
  return (
    <>
      <PageHero eyebrow="Barris" title="O tamanho certo para seu evento" text="Aniversários, casamentos, formaturas, eventos corporativos e culturais: todo pedido chega lacrado, com chopeira elétrica e entrega no mesmo dia." />
      <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 md:grid-cols-[1.1fr_1fr]">
        <img src={barris} alt="Barris de chopp em aço inox" loading="lazy" width={1200} height={912} className="h-full rounded-lg object-cover" />
        <div className="space-y-5">
          {OPCOES.map((o) => (
            <div key={o.l} className="rounded-lg border bg-card p-7">
              <h2 className="text-4xl">Barril {o.l}L</h2>
              <p className="mt-1 text-sm text-gold">{o.ideal}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {o.itens.map((i) => <li key={i} className="flex gap-2"><Check size={16} className="text-red-soft" />{i}</li>)}
              </ul>
              <a href={whatsappLink(`Olá! Quero orçamento de um barril de ${o.l}L.`)} target="_blank" rel="noreferrer" className="btn-outline-gold mt-6">
                <MessageCircle size={16} /> Orçar barril {o.l}L
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="section-wine border-t">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Delivery</p>
          <h2 className="mt-3 text-4xl">Pedido hoje, recebido hoje</h2>
          <p className="mt-3 max-w-lg text-muted-foreground">No delivery da Agnes você pede e recebe o barril no mesmo dia, com tudo o que é preciso para servir.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUSO.map((i) => (
              <div key={i.nome} className="rounded-lg border bg-card p-6">
                <Check size={18} className="text-red-soft" />
                <h3 className="mt-3 text-xl">{i.nome}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{i.desc}</p>
              </div>
            ))}
          </div>
          <a href={whatsappLink("Olá! Quero receber um barril da Agnes hoje (delivery).")} target="_blank" rel="noreferrer" className="btn-gold mt-10"><MessageCircle size={16} /> Pedir delivery hoje</a>
        </div>
      </section>
    </>
  );
}
