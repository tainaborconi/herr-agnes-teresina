import { createServerFn } from "@tanstack/react-start";
import {
  FEEDFUSION_PUBLIC_KEY,
  FEEDFUSION_USERNAME,
  FEED_POSTS,
  type FeedPost,
} from "@/lib/instagram";

/** Resposta da API do FeedFusion: a lista de posts e mais alguns campos de controle. */
type RespostaFeed = {
  posts?: unknown;
  total?: number;
  error?: string;
};

/**
 * Busca os posts mais recentes do Instagram no FeedFusion.
 * A chamada é feita no servidor: o navegador nunca vê a chave nem a resposta crua,
 * e uma falha do serviço nunca derruba a página — devolve a grade vazia.
 */
export const getInstagramFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ posts: FeedPost[]; error?: string }> => {
    const usuario = FEEDFUSION_USERNAME.trim();
    const chave = FEEDFUSION_PUBLIC_KEY.trim();
    if (!usuario || !chave) return { posts: [] };

    const url =
      `https://www.feed-fusion.com/api/feeds/${encodeURIComponent(usuario)}` +
      `?publicKey=${encodeURIComponent(chave)}&limit=${FEED_POSTS}`;

    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return { posts: [], error: "Feed indisponível no momento." };

      const dados = (await res.json()) as RespostaFeed;
      const lista = Array.isArray(dados.posts) ? (dados.posts as FeedPost[]) : [];
      const posts = lista.filter(
        (p) =>
          typeof p?.id === "string" &&
          typeof p?.permalink === "string" &&
          (typeof p?.mediaUrl === "string" || typeof p?.thumbnailUrl === "string"),
      );
      return { posts };
    } catch {
      return { posts: [], error: "Feed indisponível no momento." };
    }
  },
);
