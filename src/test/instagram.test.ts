import { describe, expect, it } from "vitest";
import { montarFeed, type FeedPost } from "@/lib/instagram";

/** Post de foto como a API do FeedFusion devolve. */
const post = (extra: Partial<FeedPost> = {}): FeedPost => ({
  id: "17894",
  timestamp: "2026-10-01T09:49:14+0000",
  permalink: "https://www.instagram.com/p/CabcDEF/",
  mediaType: "IMAGE",
  mediaUrl: "https://cdn.example.com/foto.jpg",
  thumbnailUrl: null,
  caption: "Chopp gelado na chegada dos corredores!",
  ...extra,
});

describe("grade do Instagram", () => {
  it("usa a própria foto no post de imagem", () => {
    const [tile] = montarFeed([post()]);
    expect(tile.src).toBe("https://cdn.example.com/foto.jpg");
    expect(tile.video).toBe(false);
  });

  it("usa a capa no vídeo e no álbum de fotos", () => {
    const [video] = montarFeed([
      post({ mediaType: "VIDEO", mediaUrl: "https://cdn.example.com/video.mp4", thumbnailUrl: "https://cdn.example.com/capa.jpg" }),
    ]);
    expect(video.src).toBe("https://cdn.example.com/capa.jpg");
    expect(video.video).toBe(true);

    const [album] = montarFeed([
      post({ mediaType: "CAROUSEL_ALBUM", mediaUrl: "https://cdn.example.com/1.jpg", thumbnailUrl: "https://cdn.example.com/capa-album.jpg" }),
    ]);
    expect(album.src).toBe("https://cdn.example.com/capa-album.jpg");
    expect(album.video).toBe(true);
  });

  it("cada quadrado abre o post no Instagram", () => {
    const [tile] = montarFeed([post()]);
    expect(tile.href).toBe("https://www.instagram.com/p/CabcDEF/");
  });

  it("usa a legenda como texto alternativo, sem quebras de linha", () => {
    const [tile] = montarFeed([post({ caption: "Bar de chopp\nno casamento da Ana" })]);
    expect(tile.alt).toBe("Bar de chopp no casamento da Ana");
  });

  it("dá um texto alternativo quando o post não tem legenda", () => {
    const [tile] = montarFeed([post({ caption: null })]);
    expect(tile.alt).toBe("Post de @herragnes.teresina no Instagram");
  });

  it("descarta post sem imagem ou sem link", () => {
    expect(montarFeed([post({ mediaUrl: "", thumbnailUrl: null })])).toEqual([]);
    expect(montarFeed([post({ permalink: "" })])).toEqual([]);
    expect(montarFeed([])).toEqual([]);
  });
});
