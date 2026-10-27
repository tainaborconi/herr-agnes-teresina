import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { PageHero } from "@/components/Layout";
import { SABORES, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/sabores")({
  head: () => ({
    meta: [
      { title: "Nossos sabores — HERR AGNES" },
      { name: "description", content: "Pilsen, Puro Malte, Vinho e IPA: conheça os chopps artesanais HERR AGNES." },
      { property: "og:title", content: "Sabores HERR AGNES" },
      { property: "og:description", content: "Conheça nossos chopps artesanais." },
    ],
  }),
  component: Sabores,
});

function Sabores() {
  return (
    <>
      <PageHero eyebrow="Nossos sabores" title="Escolha o seu chopp" />
      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-20 md:grid-cols-2">
        {SABORES.map((s) => (
          <div key={s.nome} className="flex flex-col rounded-lg border bg-card p-8">
            <p className="eyebrow">Teor {s.abv}</p>
            <h2 className="mt-2 text-4xl">{s.nome}</h2>
            <p className="mt-3 flex-1 text-muted-foreground">{s.desc}</p>
            <a href={whatsappLink(`Olá! Quero orçamento do chopp ${s.nome}.`)} target="_blank" rel="noreferrer" className="btn-outline-gold mt-6 w-fit">
              <MessageCircle size={16} /> Pedir {s.nome}
            </a>
          </div>
        ))}
      </section>
    </>
  );
}
