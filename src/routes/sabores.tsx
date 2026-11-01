import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/Layout";
import { SABORES } from "@/lib/site";
import miniKegs from "@/assets/Expositor de Mini-Kegs AGNES Artesanais.png";

export const Route = createFileRoute("/sabores")({
  head: () => ({
    meta: [
      { title: "Nossos sabores — HERR AGNES" },
      { name: "description", content: "Pilsen, Puro Malte, Zero Glúten, IPA, Munich e Chopp de Vinho: conheça os chopps artesanais HERR AGNES." },
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
      <img src={miniKegs} alt="Expositor de Mini-Kegs AGNES Artesanais" loading="lazy" className="mx-auto mt-10 max-h-[440px] w-full max-w-4xl rounded-lg border object-contain px-5" />
      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-20 md:grid-cols-2 lg:grid-cols-3">
        {SABORES.map((s) => (
          <div key={s.nome} className="flex flex-col rounded-lg border bg-card p-8">
            <p className="eyebrow">Chopp HERR AGNES</p>
            <h2 className="mt-2 text-4xl">{s.nome}</h2>
            <p className="mt-3 flex-1 text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </section>
      <div className="mx-auto max-w-6xl px-5 pb-20 text-center">
        <h2 className="font-display text-2xl">Já escolheu seu sabor?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Confira os tamanhos e valores e monte seu pedido online.</p>
        <Link to="/pedidos" className="btn-gold mx-auto mt-5 w-fit">Fazer pedido</Link>
      </div>
    </>
  );
}
