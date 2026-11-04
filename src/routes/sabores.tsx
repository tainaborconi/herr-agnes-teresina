import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/Layout";
import { SABORES } from "@/lib/site";
import { ChoppCarousel, type CarouselSlide } from "@/components/ChoppCarousel";
import choppVinho from "@/assets/RED WEIN - Vert.png";
import ipa from "@/assets/IPA - Vert.png";
import munich from "@/assets/MUNICH- STORIES  -Vert.png";
import pilsen from "@/assets/Pilsen  - VBERTI.png";
import puroMalte from "@/assets/PURO MALTE - VERT.png";
import semGluten from "@/assets/SEM GRU - Vert.png";

const CARROSSEL: CarouselSlide[] = [
  { src: choppVinho, alt: "Chopp Vinho HERR AGNES", titulo: "Chopp Vinho", detalhe: "Uma opção marcante para quem gosta de sabores especiais." },
  { src: ipa, alt: "Chopp IPA HERR AGNES", titulo: "IPA", detalhe: "Amargor e personalidade em cada gole." },
  { src: munich, alt: "Chopp Munich HERR AGNES", titulo: "Munich", detalhe: "Um sabor encorpado para apreciar cada momento." },
  { src: pilsen, alt: "Chopp Pilsen HERR AGNES", titulo: "Pilsen", detalhe: "Leveza e refrescância para qualquer ocasião." },
  { src: puroMalte, alt: "Chopp Puro Malte HERR AGNES", titulo: "Puro Malte", detalhe: "O clássico que combina com bons encontros." },
  { src: semGluten, alt: "Chopp sem glúten HERR AGNES", titulo: "Sem Glúten", detalhe: "Mais uma opção para brindar e compartilhar." },
];

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
      <div className="mx-auto mt-10 max-w-5xl px-5">
        <ChoppCarousel slides={CARROSSEL} />
      </div>
      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-20 pt-12 md:grid-cols-2 lg:grid-cols-3">
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
