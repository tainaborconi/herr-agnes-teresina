import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, MessageCircle, Instagram, MapPin } from "lucide-react";
import { whatsappLink } from "@/lib/site";
import logo from "@/assets/logo.png.asset.json";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/marca", label: "Conheça a marca" },
  { to: "/sabores", label: "Nossos sabores" },
  { to: "/calculadora", label: "Calcule seu chopp" },
  { to: "/barris", label: "Barris" },
  { to: "/contato", label: "Contato" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" aria-label="HERR AGNES — início"><img src={logo.url} alt="HERR AGNES Cervejaria" width={1271} height={1124} className="h-14 w-auto" /></Link>
        <nav className="hidden gap-6 text-sm lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-gold" }} activeOptions={{ exact: true }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <a href={whatsappLink("Olá! Quero um orçamento de chopp HERR AGNES.")} target="_blank" rel="noreferrer" className="btn-gold hidden lg:inline-flex">
          <MessageCircle size={16} /> Orçamento
        </a>
        <button aria-label="Menu" className="lg:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <nav className="flex flex-col gap-4 border-t px-5 py-5 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="text-foreground">{n.label}</Link>
          ))}
          <a href={whatsappLink("Olá! Quero um orçamento de chopp HERR AGNES.")} target="_blank" rel="noreferrer" className="btn-gold w-fit">
            <MessageCircle size={16} /> Pedir orçamento
          </a>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
        <div>
          <img src={logo.url} alt="HERR AGNES Cervejaria" width={1271} height={1124} loading="lazy" className="h-24 w-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Chopp artesanal em Teresina, Piauí.</p>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-center gap-2"><MapPin size={14} /> Teresina – PI</p>
          <a href={whatsappLink("Olá!")} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground"><MessageCircle size={14} /> WhatsApp</a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground"><Instagram size={14} /> Instagram</a>
        </div>
        <p className="text-xs text-muted-foreground md:text-right">Beba com moderação. Venda proibida para menores de 18 anos.</p>
      </div>
    </footer>
  );
}

export function WhatsFloat() {
  return (
    <a href={whatsappLink("Olá! Quero um orçamento de chopp HERR AGNES.")} target="_blank" rel="noreferrer" aria-label="WhatsApp"
      className="fixed bottom-5 right-5 z-50 rounded-full bg-primary p-4 text-primary-foreground shadow-lg hover:brightness-110">
      <MessageCircle />
    </a>
  );
}

export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-16 pb-10">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-5xl md:text-6xl">{title}</h1>
      {text && <p className="mt-4 max-w-2xl text-muted-foreground">{text}</p>}
    </section>
  );
}
