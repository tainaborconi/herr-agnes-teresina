import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import { PageHero } from "@/components/Layout";
import { whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato e orçamento — HERR AGNES" },
      { name: "description", content: "Peça seu orçamento de chopp artesanal em Teresina pelo WhatsApp." },
      { property: "og:title", content: "Contato HERR AGNES" },
      { property: "og:description", content: "Peça seu orçamento pelo WhatsApp." },
    ],
  }),
  component: Contato,
});

const field = "mt-2 w-full rounded-md border bg-secondary px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Contato() {
  const [f, setF] = useState({ nome: "", data: "", local: "", convidados: "", obs: "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const msg = `Olá! Sou ${f.nome}. Quero orçamento de chopp.\nData: ${f.data}\nLocal: ${f.local}\nConvidados: ${f.convidados}\n${f.obs}`;
    window.open(whatsappLink(msg), "_blank");
  };
  return (
    <>
      <PageHero eyebrow="Contato" title="Peça seu orçamento" text="Preencha os dados e envie direto para o nosso WhatsApp." />
      <section className="mx-auto max-w-2xl px-5 pb-20">
        <form onSubmit={submit} className="grid gap-5 rounded-lg border bg-card p-7 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">Nome<input required value={f.nome} onChange={set("nome")} className={field} /></label>
          <label className="text-sm">Data do evento<input required type="date" value={f.data} onChange={set("data")} className={field} /></label>
          <label className="text-sm">Convidados<input required type="number" min={1} value={f.convidados} onChange={set("convidados")} className={field} /></label>
          <label className="text-sm sm:col-span-2">Bairro / local<input required value={f.local} onChange={set("local")} className={field} /></label>
          <label className="text-sm sm:col-span-2">Observações<textarea rows={3} value={f.obs} onChange={set("obs")} className={field} /></label>
          <button type="submit" className="btn-gold w-fit"><MessageCircle size={16} /> Enviar no WhatsApp</button>
        </form>
      </section>
    </>
  );
}
