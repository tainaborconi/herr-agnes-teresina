// Número provisório — substitua pelo WhatsApp oficial da HERR AGNES.
export const WHATSAPP_NUMBER = "5586999999999";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const SABORES = [
  { nome: "Pilsen", desc: "Leve, dourado e refrescante. O clássico para qualquer festa.", abv: "4,5%" },
  { nome: "Puro Malte", desc: "Encorpado e equilibrado, com notas maltadas marcantes.", abv: "5,0%" },
  { nome: "Vinho", desc: "Chopp de vinho suave e frutado, perfeito para brindar.", abv: "5,5%" },
  { nome: "IPA", desc: "Aromático e amargor elegante para paladares exigentes.", abv: "6,0%" },
];

export const BARRIS = [30, 50] as const;

export type Perfil = "leve" | "moderado" | "intenso";
export const LITROS_POR_HORA: Record<Perfil, number> = { leve: 0.4, moderado: 0.6, intenso: 0.8 };

/** Litros estimados: pessoas que bebem × horas × consumo por hora, arredondado para cima. */
export function calcularLitros(pessoas: number, horas: number, perfil: Perfil) {
  if (pessoas <= 0 || horas <= 0) return 0;
  return Math.ceil(pessoas * horas * LITROS_POR_HORA[perfil]);
}

/** Combinação de barris de 50L e 30L que cobre os litros com a menor sobra. */
export function sugerirBarris(litros: number) {
  if (litros <= 0) return { b50: 0, b30: 0, total: 0 };
  let best = { b50: 0, b30: Math.ceil(litros / 30), total: Math.ceil(litros / 30) * 30 };
  for (let b50 = 0; b50 <= Math.ceil(litros / 50); b50++) {
    const resto = Math.max(0, litros - b50 * 50);
    const b30 = Math.ceil(resto / 30);
    const total = b50 * 50 + b30 * 30;
    if (total < best.total || (total === best.total && b50 + b30 < best.b50 + best.b30)) best = { b50, b30, total };
  }
  return best;
}
