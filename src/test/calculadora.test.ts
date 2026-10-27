import { describe, it, expect } from "vitest";
import { calcularLitros, sugerirBarris } from "@/lib/site";

describe("calculadora de chopp", () => {
  it("50 pessoas, 5h, moderado = 150L", () => {
    expect(calcularLitros(50, 5, "moderado")).toBe(150);
  });
  it("sugere 3 barris de 50L para 150L", () => {
    expect(sugerirBarris(150)).toEqual({ b50: 3, b30: 0, total: 150 });
  });
  it("80L vira 50L + 30L", () => {
    expect(sugerirBarris(80)).toEqual({ b50: 1, b30: 1, total: 80 });
  });
});
