import { describe, expect, it } from "vitest";

import { detectFraudSignals, parseReplyClassification } from "./reply-classification.js";

describe("reply classification", () => {
  it("accepts explicit classes including ambiguity", () => expect(parseReplyClassification('{"classification":"AMBIGUO"}').classification).toBe("AMBIGUO"));
  it("rejects unknown classes", () => expect(() => parseReplyClassification('{"classification":"OFERTA"}')).toThrow("inválida"));
  it("flags payment and secrets", () => expect(detectFraudSignals("Pague uma taxa e envie seu código de verificação")).toEqual(["Solicitação de pagamento", "Solicitação de segredo ou código"]));
  it("does not flag an ordinary interview invitation", () => expect(detectFraudSignals("Gostaríamos de agendar uma entrevista técnica")).toEqual([]));
});
