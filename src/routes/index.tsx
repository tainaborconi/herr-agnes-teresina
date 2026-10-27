import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Calculator, Award, Truck, Snowflake } from "lucide-react";
import hero from "@/assets/hero.jpg";
import festa from "@/assets/festa.jpg";
import corridaAdvocacia from "@/assets/corrida-advocacia-2026.jpg.asset.json";
import oktoberfest from "@/assets/oktoberfest-parnaiba-2026.jpg.asset.json";
import bbqFest from "@/assets/bbq-fest-beer-picos-2026.png.asset.json";
import { SABORES, whatsappLink } from "@/lib/site";

const EVENTOS = [
  {
    nome: "Corrida da Advocacia Teresina 2026",
    detalhe: "Chopp gelado servido na chegada dos corredores.",
    src: corridaAdvocacia.url,
  },
  {
    nome: "Oktoberfest Parnaíba 2026",
    detalhe: "Nossos chopps na maior festa da cerveja no litoral do Piauí.",
    src: oktoberfest.url,
  },
  {
    nome: "BBQ FEST & BEER – Picos 2026",
    detalhe: "Chopp AGNES Express no festival de churrasco e street food em Picos.",
    src: bbqFest.url,
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HERR AGNES — Chopp artesanal para festas em Teresina" },
      { name: "description", content: "Chopp artesanal premium em Teresina. Calcule quantos litros sua festa precisa e peça orçamento no WhatsApp." },
      { property: "og:title", content: "HERR AGNES — Chopp artesanal em Teresina" },
      { property: "og:description", content: "Calcule seu chopp e peça orçamento no WhatsApp." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="relative overflow-hidden">
        <img src={hero} alt="Copo de chopp HERR AGNES com espuma cremosa" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 py-28 md:py-40">
          <p className="eyebrow">Chopp artesanal · Teresina – PI</p>
          <h1 className="mt-4 text-4xl leading-[1.06] sm:text-5xl md:text-6xl lg:text-7xl">
            AGNES,
            <br />O SABOR DE
            <br />SER FELIZ!
          </h1>
          <p className="mt-5 max-w-md text-muted-foreground">Chopp gelado, cremoso e entregue no seu evento. Do aniversário ao casamento.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={whatsappLink("Olá! Quero um orçamento de chopp HERR AGNES.")} target="_blank" rel="noreferrer" className="btn-gold"><MessageCircle size={16} /> Pedir orçamento</a>
            <Link to="/calculadora" className="btn-outline-gold"><Calculator size={16} /> Calcular meu chopp</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-20 md:grid-cols-3">
        {[
          { i: Award, t: "Qualidade artesanal", d: "Receitas próprias e ingredientes selecionados." },
          { i: Snowflake, t: "Sempre gelado", d: "Chopeira e gelo para servir na temperatura ideal." },
          { i: Truck, t: "Entrega em Teresina", d: "Levamos e recolhemos os barris no seu evento." },
        ].map(({ i: Icon, t, d }) => (
          <div key={t} className="rounded-lg border bg-card p-7">
            <Icon className="text-red-soft" />
            <h3 className="mt-4 text-2xl">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Nossos sabores</p>
          <h2 className="mt-3 text-4xl">Um chopp para cada ocasião</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SABORES.map((s) => (
              <div key={s.nome} className="rounded-lg border p-6">
                
                <h3 className="mt-1 text-2xl">{s.nome}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <Link to="/sabores" className="btn-outline-gold mt-10">Ver todos os sabores</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
        <img src={festa} alt="Amigos brindando com chopp" loading="lazy" width={1200} height={912} className="rounded-lg" />
        <div>
          <p className="eyebrow">Calculadora</p>
          <h2 className="mt-3 text-4xl">Quantos litros sua festa precisa?</h2>
          <p className="mt-4 text-muted-foreground">Informe convidados e duração. Indicamos a quantidade e os barris ideais em segundos.</p>
          <Link to="/calculadora" className="btn-gold mt-8"><Calculator size={16} /> Calcular agora</Link>
        </div>
      </section>

      <section className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Eventos</p>
          <h2 className="mt-3 text-4xl">A Agnes nos eventos</h2>
          <p className="mt-3 max-w-lg text-muted-foreground">Levamos nosso chopp para corridas, festas e encontros por Teresina.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {EVENTOS.map((e) => (
              <figure key={e.nome} className="rounded-lg border p-3">
                <img src={e.src} alt={e.nome} loading="lazy" className="aspect-[3/4] w-full rounded-md object-cover" />
                <figcaption className="px-2 py-3">
                  <h3 className="text-xl">{e.nome}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{e.detalhe}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
