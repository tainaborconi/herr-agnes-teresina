/** Perfil oficial da HERR AGNES no Instagram. */
export const INSTAGRAM_HANDLE = "herragnes.teresina";
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

/**
 * Feed criado em feed-fusion.com (plano gratuito: 1 conta, 10 mil visitas/mês).
 * O painel do FeedFusion mostra o nome de usuário e a "public key" (32 caracteres)
 * na página do feed conectado — os dois valores vão aqui.
 * A chave é pública por natureza: ela aparece no código de qualquer site que use
 * o FeedFusion, e o próprio serviço libera o acesso pelo navegador (CORS aberto).
 * Deixe em branco enquanto o feed não for criado: a faixa mostra o convite para seguir.
 */
export const FEEDFUSION_USERNAME = "herragnes.teresina";
export const FEEDFUSION_PUBLIC_KEY = "51799b1c75aceeca3f2ad8db803f89df";

/** Quantos posts buscar para a grade da home. */
export const FEED_POSTS = 8;

/** Um post devolvido pela API do FeedFusion. */
export type FeedPost = {
  id: string;
  timestamp: string;
  permalink: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
};

/** Um post pronto para virar um quadrado na grade. */
export type FeedTile = {
  id: string;
  href: string;
  src: string;
  alt: string;
  video: boolean;
};

/**
 * Prepara os posts para a grade: usa a capa em vídeos e álbuns, a própria foto
 * nos posts simples, e descarta o que não tiver imagem ou link utilizável.
 */
export function montarFeed(posts: FeedPost[]): FeedTile[] {
  return posts
    .map((p) => {
      const src = (p.thumbnailUrl || p.mediaUrl || "").trim();
      const href = (p.permalink || "").trim();
      if (!src || !href) return null;
      const legenda = (p.caption || "").replace(/\s+/g, " ").trim();
      return {
        id: p.id,
        href,
        src,
        alt: legenda ? legenda.slice(0, 120) : `Post de @${INSTAGRAM_HANDLE} no Instagram`,
        video: p.mediaType !== "IMAGE",
      };
    })
    .filter((t): t is FeedTile => t !== null);
}
