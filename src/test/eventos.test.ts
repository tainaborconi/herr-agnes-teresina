import { describe, it, expect } from "vitest";
import { INCLUSO, TIPOS_EVENTO } from "@/lib/site";

describe("eventos e delivery HERR AGNES", () => {
  it("lista os tipos de evento atendidos pela marca", () => {
    const nomes = TIPOS_EVENTO.map((e) => e.nome);
    for (const esperado of [
      "Aniversários",
      "Casamentos",
      "Formaturas",
      "Eventos corporativos",
      "Eventos culturais",
    ]) {
      expect(nomes).toContain(esperado);
    }
  });

  it("inclui barril lacrado, chopeira elétrica, kit de extração e suporte 24h", () => {
    expect(INCLUSO.map((i) => i.nome)).toEqual([
      "Barril lacrado",
      "Chopeira elétrica",
      "Kit de extração",
      "Suporte via WhatsApp 24h",
    ]);
  });
});
