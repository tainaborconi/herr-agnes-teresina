import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/Layout";
import festa from "@/assets/festa.jpg";

export const Route = createFileRoute("/marca")({
  head: () => ({
    meta: [
      { title: "Conheça a marca — HERR AGNES" },
      { name: "description", content: "A história e os valores da HERR AGNES, chopp artesanal de Teresina." },
      { property: "og:title", content: "Conheça a HERR AGNES" },
      { property: "og:description", content: "Tradição, qualidade e confiança em cada barril." },
    ],
  }),
  component: Marca,
});

function Marca() {
  return (
    <>
      <PageHero eyebrow="Conheça a marca" title="Feito com tradição" text="A HERR AGNES nasceu da paixão pelo chopp bem tirado e pelos bons encontros. Produzimos com cuidado artesanal para levar qualidade às festas de Teresina." />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 md:grid-cols-2">
        <img src={festa} alt="Confraternização com chopp" loading="lazy" width={1200} height={912} className="rounded-lg" />
        <div className="space-y-6">
          {[
            ["Qualidade", "Matéria-prima selecionada e controle em cada lote."],
            ["Confiança", "Atendimento próximo, pontualidade e transparência."],
            ["Tradição", "Receitas inspiradas na escola cervejeira alemã."],
          ].map(([t, d]) => (
            <div key={t} className="border-l-2 border-red-soft pl-5">
              <h3 className="text-2xl">{t}</h3>
              <p className="mt-1 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
