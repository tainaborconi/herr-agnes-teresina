// WhatsApp oficial da HERR AGNES.
export const WHATSAPP_NUMBER = "5586994274772";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const SABORES = [
  { nome: "Pilsen", desc: "Leve, dourado e refrescante. O clássico para qualquer festa." },
  { nome: "Puro Malte", desc: "Encorpado e equilibrado, com notas maltadas marcantes." },
  { nome: "Zero Glúten", desc: "Todo o sabor do chopp, sem glúten. Para todos brindarem." },
  { nome: "IPA", desc: "Aromático, com amargor elegante para paladares exigentes." },
  { nome: "Munich", desc: "Escuro e maltado, com notas de caramelo e tradição alemã." },
  { nome: "Chopp de Vinho", desc: "Suave e frutado, perfeito para brindar." },
];

export const BARRIS = [30, 50] as const;

/** Tipos de evento que a HERR AGNES atende em Teresina. */
export const TIPOS_EVENTO = [
  { nome: "Aniversários", desc: "Do infantil ao marco de 50 anos, com chopp sempre gelado." },
  { nome: "Casamentos", desc: "Bar de chopp para a recepção e o brinde dos noivos." },
  { nome: "Formaturas", desc: "Barris e chopeira para a festa durar a noite toda." },
  { nome: "Eventos corporativos", desc: "Confraternizações, lançamentos e happy hours da empresa." },
  { nome: "Eventos culturais", desc: "Feiras, shows e festivais com estrutura pronta para servir." },
  { nome: "Outros formatos", desc: "Churrasco, inauguração, reunião de amigos: a gente atende." },
];

/** Tudo que já vem no pedido da Agnes, sem custo extra para montar. */
export const INCLUSO = [
  { nome: "Barril lacrado", desc: "Chega vedado, com selo de origem e data de envase." },
  { nome: "Chopeira elétrica", desc: "Gela e serve no ponto certo do primeiro ao último copo." },
  { nome: "Kit de extração", desc: "Tudo para puxar o chopp com o creme na medida." },
  { nome: "Suporte via WhatsApp 24h", desc: "Resposta rápida se algo precisar durante o seu evento." },
];

/**
 * Estimativa de chopp por número de convidados, na tabela oficial da HERR AGNES.
 * São faixas de 5 em 5 convidados; a cada 6 faixas a quantidade se repete
 * (26 a 30 = 50L, 56 a 60 = 100L, 86 a 90 = 150L, 116 a 120 = 200L,
 * 146 a 150 = 250L, 176 a 180 = 300L). A tabela oficial cobre 1 a 200
 * convidados; acima disso o mesmo ritmo continua.
 */
export const MAX_CONVIDADOS_TABELA = 200;

export function calcularLitros(pessoas: number) {
  if (pessoas <= 0) return 0;
  const faixa = Math.ceil(pessoas / 5); // faixa 1 = 1 a 5 convidados, 2 = 6 a 10...
  return 10 * (faixa - Math.floor(faixa / 6));
}

export const OBS_CALCULADORA =
  "Os valores são estimativas iniciais e podem variar conforme a duração do evento, o perfil dos convidados, o clima e o consumo de outras bebidas.";


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
