/** Validação de área de entrega por CEP (consulta ViaCEP). */

export const CIDADES_ATENDIDAS = [
  { cidade: "Teresina", uf: "PI" },
  { cidade: "Timon", uf: "MA" },
] as const;

export type ResultadoCep =
  | { status: "atendido"; cep: string; cidade: string; uf: string; logradouro: string; bairro: string }
  | { status: "fora_area"; cep: string; cidade: string; uf: string }
  | { status: "invalido"; mensagem: string }
  | { status: "nao_encontrado"; mensagem: string }
  | { status: "erro"; mensagem: string };

export const MSG_FORA_AREA =
  "Poxa, ainda não entregamos nesse endereço. No momento, nossas entregas estão disponíveis apenas em Teresina, Timon e regiões atendidas próximas. Se quiser, fale com a nossa equipe pelo WhatsApp.";

const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export const limparCep = (valor: string) => valor.replace(/\D/g, "").slice(0, 8);
export const formatarCep = (valor: string) => {
  const d = limparCep(valor);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export function cidadeAtendida(cidade: string, uf: string) {
  return CIDADES_ATENDIDAS.some((c) => normalizar(c.cidade) === normalizar(cidade) && c.uf === uf.trim().toUpperCase());
}

type ViaCep = { erro?: boolean | string; localidade?: string; uf?: string; logradouro?: string; bairro?: string };

export async function consultarCep(valor: string, fetcher: typeof fetch = fetch): Promise<ResultadoCep> {
  const cep = limparCep(valor);
  if (cep.length !== 8) return { status: "invalido", mensagem: "CEP inválido. Digite os 8 números do CEP." };
  let dados: ViaCep;
  try {
    const res = await fetcher(`https://viacep.com.br/ws/${cep}/json/`);
    if (res.status === 400) return { status: "invalido", mensagem: "CEP inválido. Confira os números digitados." };
    if (!res.ok) throw new Error(String(res.status));
    dados = (await res.json()) as ViaCep;
  } catch {
    return { status: "erro", mensagem: "Não conseguimos consultar o CEP agora. Tente novamente em instantes ou fale com a gente pelo WhatsApp." };
  }
  if (dados.erro || !dados.localidade || !dados.uf) {
    return { status: "nao_encontrado", mensagem: "CEP não encontrado. Confira os números e tente novamente." };
  }
  if (!cidadeAtendida(dados.localidade, dados.uf)) {
    return { status: "fora_area", cep, cidade: dados.localidade, uf: dados.uf };
  }
  return { status: "atendido", cep, cidade: dados.localidade, uf: dados.uf, logradouro: dados.logradouro ?? "", bairro: dados.bairro ?? "" };
}
