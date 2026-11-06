import { describe, expect, it } from "vitest";
import { consultarCep } from "@/lib/cep";

const mock = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("área de entrega por CEP", () => {
  it("libera Teresina-PI", async () => {
    expect((await consultarCep("64000-000", mock({ localidade: "Teresina", uf: "PI" }))).status).toBe("atendido");
  });
  it("libera Timon-MA", async () => {
    expect((await consultarCep("65630000", mock({ localidade: "Timon", uf: "MA" }))).status).toBe("atendido");
  });
  it("bloqueia outra cidade", async () => {
    expect((await consultarCep("01001000", mock({ localidade: "São Paulo", uf: "SP" }))).status).toBe("fora_area");
  });
  it("bloqueia Teresina com UF errada", async () => {
    expect((await consultarCep("01001000", mock({ localidade: "Teresina", uf: "MA" }))).status).toBe("fora_area");
  });
  it("CEP incompleto é inválido", async () => {
    expect((await consultarCep("6400", mock({}))).status).toBe("invalido");
  });
  it("CEP inexistente não libera", async () => {
    expect((await consultarCep("99999999", mock({ erro: true }))).status).toBe("nao_encontrado");
  });
  it("falha na consulta não libera", async () => {
    const falha = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    expect((await consultarCep("64000000", falha)).status).toBe("erro");
  });
});
