import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/Layout";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — HERR AGNES" },
      { name: "description", content: "Entre em contato com a HERR AGNES ou faça seu pedido online." },
      { property: "og:title", content: "Contato HERR AGNES" },
      { property: "og:description", content: "Entre em contato com a HERR AGNES ou faça seu pedido online." },
    ],
  }),
  component: Contato,
});

function Contato() {
  return (
    <>
      <PageHero eyebrow="Contato" title="Estamos à disposição" text="Ficou com alguma dúvida? Fale com nossa equipe. Para consultar os sabores, preços e condições e enviar seu pedido, acesse nossa página de pedidos online." />
      <section className="mx-auto max-w-2xl px-5 pb-20">
        <div className="section-wine grid gap-4 rounded-lg border p-7 text-center">
          <h2 className="font-display text-2xl">Faça seu pedido online</h2>
          <p className="text-sm text-muted-foreground">Confira os tamanhos, sabores e valores disponíveis. Monte seu pedido e envie as informações diretamente para nossa equipe pelo WhatsApp.</p>
          <Link to="/pedidos" className="btn-gold mx-auto mt-2 w-fit">Acessar página de pedidos</Link>
        </div>
      </section>
    </>
  );
}
