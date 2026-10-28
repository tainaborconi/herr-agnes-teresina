import { Instagram, Play } from "lucide-react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, montarFeed, type FeedPost } from "@/lib/instagram";

type Feed = { posts: FeedPost[]; error?: string };

/**
 * Faixa de Instagram na home: a grade dos posts mais recentes, lida pelo FeedFusion.
 * Cada quadrado abre o post no Instagram. Sem posts (feed ainda não conectado ou
 * fora do ar), a faixa mostra o convite para seguir o perfil.
 */
export function InstagramBand({ feed }: { feed?: Feed }) {
  const posts = feed?.posts ?? [];
  const tiles = montarFeed(posts);

  return (
    <section className="section-wine">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">Instagram</p>
        <h2 className="mt-3 text-3xl sm:text-4xl">Acompanhe-nos no Instagram</h2>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Bastidores, eventos e os chopps da Agnes, direto do nosso perfil.
        </p>

        {tiles.length > 0 ? (
          <>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tiles.map((t) => (
                <a
                  key={t.id}
                  href={t.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Ver post no Instagram: ${t.alt}`}
                  className="group relative block aspect-square overflow-hidden rounded-lg border bg-secondary"
                >
                  <img
                    src={t.src}
                    alt={t.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-overlay opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Instagram size={26} className="text-gold" />
                  </span>
                  {t.video && (
                    <span className="absolute right-2 top-2 rounded-full bg-overlay p-1.5">
                      <Play size={12} className="text-gold" />
                    </span>
                  )}
                </a>
              ))}
            </div>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn-outline-gold mt-10">
              <Instagram size={16} /> Seguir @{INSTAGRAM_HANDLE}
            </a>
          </>
        ) : (
          <div className="mt-10 rounded-lg border bg-card p-8 text-center sm:p-12">
            <p className="text-muted-foreground">
              As fotos mais recentes do @{INSTAGRAM_HANDLE} entram aqui assim que o perfil for conectado.
            </p>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn-outline-gold mt-6">
              <Instagram size={16} /> Seguir @{INSTAGRAM_HANDLE}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
