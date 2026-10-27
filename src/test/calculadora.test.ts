import { describe, it, expect } from "vitest";
import { calcularLitros, sugerirBarris } from "@/lib/site";

/** Tabela oficial HERR AGNES: [convidados, litros]. */
const TABELA: [number, number][] = [
  [1, 10], [5, 10],
  [6, 20], [10, 20],
  [11, 30], [15, 30],
  [16, 40], [20, 40],
  [21, 50], [25, 50],
  [26, 50], [30, 50],
  [31, 60], [35, 60],
  [36, 70], [40, 70],
  [41, 80], [45, 80],
  [46, 90], [50, 90],
  [51, 100], [55, 100],
  [56, 100], [60, 100],
  [61, 110], [65, 110],
  [66, 120], [70, 120],
  [71, 130], [75, 130],
  [76, 140], [80, 140],
  [81, 150], [85, 150],
  [86, 150], [90, 150],
  [91, 160], [95, 160],
  [96, 170], [100, 170],
  [101, 180], [105, 180],
  [106, 190], [110, 190],
  [111, 200], [115, 200],
  [116, 200], [120, 200],
  [121, 210], [125, 210],
  [126, 220], [130, 220],
  [131, 230], [135, 230],
  [136, 240], [140, 240],
  [141, 250], [145, 250],
  [146, 250], [150, 250],
  [151, 260], [155, 260],
  [156, 270], [160, 270],
  [161, 280], [165, 280],
  [166, 290], [170, 290],
  [171, 300], [175, 300],
  [176, 300], [180, 300],
  [181, 310], [185, 310],
  [186, 320], [190, 320],
  [191, 330], [195, 330],
  [196, 340], [200, 340],
];

describe("calculadora de chopp", () => {
  it("reproduz a tabela oficial em todas as faixas de 1 a 200 convidados", () => {
    for (const [convidados, litros] of TABELA) {
      expect(calcularLitros(convidados), `${convidados} convidados`).toBe(litros);
    }
  });

  it("repete a quantidade nas faixas 26-30, 56-60 e 176-180", () => {
    expect(calcularLitros(25)).toBe(50);
    expect(calcularLitros(26)).toBe(50);
    expect(calcularLitros(55)).toBe(100);
    expect(calcularLitros(56)).toBe(100);
    expect(calcularLitros(175)).toBe(300);
    expect(calcularLitros(176)).toBe(300);
  });

  it("zera sem convidados", () => {
    expect(calcularLitros(0)).toBe(0);
    expect(calcularLitros(-10)).toBe(0);
  });

  it("sugere 3 barris de 50L para 150L", () => {
    expect(sugerirBarris(150)).toEqual({ b50: 3, b30: 0, total: 150 });
  });
  it("80L vira 50L + 30L", () => {
    expect(sugerirBarris(80)).toEqual({ b50: 1, b30: 1, total: 80 });
  });
});
