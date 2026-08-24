import { describe, expect, it } from "vitest";
import { errorDetails } from "./logger.js";

describe("observability", () => {
  it("normaliza Error sem perder tipo e mensagem", () => {
    expect(errorDetails(new TypeError("inválido"))).toMatchObject({ errorType: "TypeError", errorMessage: "inválido" });
  });

  it("não serializa valores desconhecidos potencialmente sensíveis", () => {
    expect(errorDetails({ password: "secret" })).toEqual({ errorType: "UnknownError", errorMessage: "Erro desconhecido" });
  });
});
