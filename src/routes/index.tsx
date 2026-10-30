import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Calculator, Check, PartyPopper, Heart, GraduationCap, Building2, Music2, Sparkles, type LucideIcon } from "lucide-react";
import festa from "@/assets/festa.jpg";
import barris from "@/assets/565388034_17925816492157491_3189516691680693208_n.jpg";
import tirandoChopp from "@/assets/88.jpg";
import evAniversario from "@/assets/ev-aniversario.jpg";
import evCasamento from "@/assets/ev-casamento.jpg";
import evFormatura from "@/assets/ev-formatura.jpg";
import evCorporativo from "@/assets/ev-corporativo.jpg";
import corridaAdvocacia from "@/assets/corrida-advocacia-2026.jpg.asset.json";
import oktoberfest from "@/assets/oktoberfest-parnaiba-2026.jpg.asset.json";
import bbqFest from "@/assets/bbq-fest-beer-picos-2026.png.asset.json";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SABORES, TIPOS_EVENTO, INCLUSO, whatsappLink, DURACOES, DURACAO_PADRAO, calcularLitros, sugerirBarris } from "@/lib/site";
import { InstagramBand } from "@/components/InstagramFeed";
import { ChoppCarousel, type CarouselSlide } from "@/components/ChoppCarousel";
import { feedQueryOptions } from "@/lib/instagram.queries";

type Evento = { nome: string; detalhe: string; src: string; pos?: string };

const EVENTOS: Evento[] = [
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
    pos: "bottom",
  },
];

const ICONE_EVENTO: Record<string, LucideIcon> = {
  "Aniversários": PartyPopper,
  "Casamentos": Heart,
  "Formaturas": GraduationCap,
  "Eventos corporativos": Building2,
  "Eventos culturais": Music2,
  "Outros formatos": Sparkles,
};

const CARROSSEL: CarouselSlide[] = [
  { src: evAniversario, alt: "Copos de chopp AGNES em uma festa de aniversário", titulo: "Aniversários", detalhe: "O brinde que anima a festa do começo ao fim." },
  { src: evCasamento, alt: "Taças de chopp AGNES servidas em um casamento", titulo: "Casamentos", detalhe: "Chopp gelado no brinde do grande dia." },
  { src: evFormatura, alt: "Copos de chopp AGNES em uma festa de formatura", titulo: "Formaturas", detalhe: "A comemoração que coroa o diploma." },
  { src: evCorporativo, alt: "Chopeira AGNES servindo chopp em um evento corporativo", titulo: "Eventos corporativos", detalhe: "Estação de chopp para eventos da empresa." },
  { src: festa, alt: "Convidados brindando com chopp AGNES em uma festa", titulo: "Festas e encontros", detalhe: "Do churrasco de amigos ao evento cultural: a Agnes vai." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HERR AGNES — Chopp artesanal para festas em Teresina" },
      { name: "description", content: "Chopp artesanal premium em Teresina para aniversários, casamentos, formaturas e eventos corporativos. Delivery com barril no mesmo dia." },
      { property: "og:title", content: "HERR AGNES — Chopp artesanal em Teresina" },
      { property: "og:description", content: "Aniversários, casamentos, formaturas e eventos corporativos com chopp gelado. Delivery no mesmo dia em Teresina." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedQueryOptions),
  component: Index,
});

const calcField = "mt-2 w-full rounded-md border bg-secondary px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function HomeCalculator() {
  const [pessoas, setPessoas] = useState(50);
  const [horas, setHoras] = useState<number>(DURACAO_PADRAO);
  const [sabores, setSabores] = useState<string[]>([]);
  const alternarSabor = (nome: string) =>
    setSabores((atuais) => atuais.includes(nome) ? atuais.filter((s) => s !== nome) : [...atuais, nome]);
  const litros = calcularLitros(pessoas, horas);
  const barris = sugerirBarris(litros);
  const barrisTxt = [barris.b50 && `${barris.b50} barril(is) de 50L`, barris.b30 && `${barris.b30} barril(is) de 30L`].filter(Boolean).join(" + ");
  const duracao = DURACOES.find((d) => d.h === horas)?.rotulo ?? `${horas} horas`;
  const saborTxt = sabores.length ? sabores.join(", ") : "a definir com a Agnes";
  const mensagem = `Olá! Gostaria de um orçamento de chopp para ${pessoas} convidados, com duração de ${duracao}. Estimativa: ${litros}L (${barrisTxt || "quantidade a definir"}). Sabores escolhidos: ${saborTxt}.`;

  return (
    <div className="grid gap-6 rounded-lg border bg-card p-6 md:grid-cols-2 md:p-8">
      <div className="space-y-5">
        <label className="block text-sm">Número de convidados
          <input type="number" min={1} max={1000} value={pessoas} onChange={(e) => setPessoas(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))} className={calcField} />
        </label>
        <label className="block text-sm">Duração da festa
          <select value={horas} onChange={(e) => setHoras(Number(e.target.value))} className={calcField}>
            {DURACOES.map((d) => <option key={d.h} value={d.h}>{d.rotulo}</option>)}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm">Sabor do chopp <span className="text-muted-foreground">(opcional)</span></legend>
          <p className="mt-1 text-xs text-muted-foreground">Escolha um ou mais sabores. Essa seleção não altera a quantidade estimada; ela será enviada junto ao pedido de orçamento.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SABORES.map((s) => {
              const ativo = sabores.includes(s.nome);
              return (
                <button
                  type="button"
                  key={s.nome}
                  aria-pressed={ativo}
                  onClick={() => alternarSabor(s.nome)}
                  className={
                    ativo
                      ? "inline-flex items-center gap-1.5 rounded-md border border-gold bg-wine px-3 py-2 text-sm font-semibold text-primary-foreground"
                      : "inline-flex items-center gap-1.5 rounded-md border bg-secondary px-3 py-2 text-sm text-foreground hover:bg-accent"
                  }
                >
                  {ativo && <Check size={14} />} {s.nome}
                </button>
              );
            })}
          </div>
        </fieldset>
        <p className="text-xs text-muted-foreground">Estimativa inicial; o consumo pode variar conforme o perfil dos convidados, o clima e outras bebidas.</p>
      </div>
      <div className="section-wine flex flex-col justify-between rounded-lg border p-6">
        <div>
          <p className="eyebrow">Sua estimativa</p>
          <p className="mt-3 font-display text-5xl text-gold sm:text-6xl">{litros}<span className="ml-2 text-2xl">litros</span></p>
          <p className="mt-3 text-sm text-muted-foreground">Para {pessoas} convidados em {duracao.toLowerCase()}, sugerimos:</p>
          <p className="mt-2 font-semibold">{barrisTxt || "Consulte a equipe para definir os barris"}{barris.total > 0 ? ` (${barris.total}L no total)` : ""}</p>
        </div>
        <a href={whatsappLink(mensagem)} target="_blank" rel="noreferrer" className="btn-gold mt-6 w-fit"><MessageCircle size={16} /> Pedir orçamento no WhatsApp</a>
      </div>
    </div>
  );
}

function Index() {
  const { data: feed } = useSuspenseQuery(feedQueryOptions);
  return (
    <>
      <section className="relative overflow-hidden">
        <img src={tirandoChopp} alt="Chopp HERR AGNES sendo servido" width={1024} height={1280} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 py-28 md:py-40">
          <p className="eyebrow">Chopp artesanal · Teresina – PI</p>
          <h1 className="mt-4 max-w-4xl text-4xl leading-[1.06] sm:text-5xl md:text-6xl lg:text-7xl">
            Seu evento merece AGNES.
          </h1>
          <p className="mt-5 max-w-md text-muted-foreground">Chopp gelado, cremoso e entregue no seu evento. Do aniversário ao casamento.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={whatsappLink("Olá! Quero um orçamento de chopp HERR AGNES.")} target="_blank" rel="noreferrer" className="btn-gold"><MessageCircle size={16} /> Pedir orçamento</a>
            <Link to="/calculadora" className="btn-outline-gold"><Calculator size={16} /> Calcular meu chopp</Link>
          </div>
        </div>
      </section>

      <section className="border-y">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="eyebrow">Delivery</p>
            <h2 className="mt-3 text-4xl">Pediu, recebeu: o barril chega no mesmo dia</h2>
            <p className="mt-4 text-muted-foreground">No modo delivery da Agnes você escolhe o sabor, combina tudo pelo WhatsApp e recebe o barril pronto para servir no mesmo dia do evento.</p>
            <a href={whatsappLink("Olá! Quero o delivery de chopp da Agnes no mesmo dia.")} target="_blank" rel="noreferrer" className="btn-gold mt-8"><MessageCircle size={16} /> Pedir delivery hoje</a>
            <img src={barris} alt="Barril e chopeira elétrica montados para a festa" width={1280} height={720} loading="lazy" className="mt-10 aspect-video w-full rounded-lg border object-cover" />
          </div>
          <div className="rounded-lg border bg-card p-7">
            <h3 className="text-2xl">O que já vem incluso</h3>
            <ul className="mt-5 space-y-4">
              {INCLUSO.map((i) => (
                <li key={i.nome} className="flex gap-3">
                  <Check size={18} className="mt-1 shrink-0 text-red-soft" />
                  <div>
                    <p className="font-semibold">{i.nome}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{i.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-wine">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Eventos que atendemos</p>
          <h2 className="mt-3 text-4xl">Levamos chopp para qualquer evento</h2>
          <p className="mt-3 max-w-lg text-muted-foreground">De uma reunião de amigos a uma produção grande em Teresina: diga o formato da festa e a gente monta o chopp.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TIPOS_EVENTO.map((e) => {
              const Icon = ICONE_EVENTO[e.nome] ?? Sparkles;
              return (
                <div key={e.nome} className="rounded-lg border bg-card">
                  <div className="p-6">
                    <div className="flex items-center gap-3"><Icon className="text-red-soft" /><h3 className="text-xl">{e.nome}</h3></div>
                    <p className="mt-2 text-sm text-muted-foreground">{e.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <a href={whatsappLink("Olá! Vou fazer um evento e quero chopp da Agnes.")} target="_blank" rel="noreferrer" className="btn-outline-gold mt-10"><MessageCircle size={16} /> Cotar meu evento</a>
        </div>
      </section>

      <section className="border-y">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Nossos sabores</p>
          <h2 className="mt-3 text-4xl">Um chopp para cada ocasião</h2>
          <div className="mt-8">
            <ChoppCarousel slides={CARROSSEL} />
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SABORES.map((s) => (
              <div key={s.nome} className="rounded-lg border bg-card p-6">
                <h3 className="mt-1 text-2xl">{s.nome}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <a href={whatsappLink("Olá! Quero conhecer os sabores de chopp HERR AGNES e fazer um orçamento.")} target="_blank" rel="noreferrer" className="btn-outline-gold mt-10"><MessageCircle size={16} /> Consultar sabores pelo WhatsApp</a>
        </div>
      </section>

      <section className="section-wine" id="calculadora">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-8">
            <p className="eyebrow">Calculadora</p>
            <h2 className="mt-3 text-4xl">Quantos litros sua festa precisa?</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">Descubra uma estimativa de chopp para sua festa sem sair da página.</p>
          </div>
          <HomeCalculator />
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Eventos</p>
          <h2 className="mt-3 text-4xl">A Agnes nos eventos</h2>
          <p className="mt-3 max-w-lg text-muted-foreground">Levamos nosso chopp para corridas, festas e encontros por Teresina.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {EVENTOS.map((e) => (
              <figure key={e.nome} className="rounded-lg border bg-card p-3">
                <img src={e.src} alt={e.nome} loading="lazy" style={{ objectPosition: e.pos ?? "center" }} className="aspect-[3/4] w-full rounded-md object-cover" />
                <figcaption className="px-2 py-3">
                  <h3 className="text-xl">{e.nome}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{e.detalhe}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <InstagramBand feed={feed} />
    </>
  );
}
