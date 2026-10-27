import { Instagram } from "lucide-react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, SNAPWIDGET_ID } from "@/lib/instagram";

/**
 * Faixa de Instagram na home. Quando SNAPWIDGET_ID estiver preenchido, o widget
 * incorporado mostra os posts mais recentes; enquanto isso, a faixa traz o
 * convite para seguir o perfil.
 */
export function InstagramBand() {
  const widgetId = SNAPWIDGET_ID.trim();

  return (
    <section className="section-wine">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">Instagram</p>
        <h2 className="mt-3 text-4xl">Acompanhe o @{INSTAGRAM_HANDLE}</h2>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Bastidores, eventos e os chopps da Agnes, direto do nosso perfil.
        </p>

        {widgetId ? (
          <iframe
            title={`Posts do Instagram @${INSTAGRAM_HANDLE}`}
            src={`https://snapwidget.com/embed/${widgetId}`}
            className="mt-10 w-full"
            style={{ border: "none", overflow: "hidden", minHeight: 640 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="mt-10 rounded-lg border bg-card p-8 text-center sm:p-12">
            <p className="text-muted-foreground">
              As fotos mais recentes do @{INSTAGRAM_HANDLE} entram aqui assim que o perfil for conectado.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-outline-gold mt-6"
            >
              <Instagram size={16} /> Seguir @{INSTAGRAM_HANDLE}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
