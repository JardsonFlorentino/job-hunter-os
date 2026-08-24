import { describe, expect, it } from "vitest";

import { isBrazilLocation } from "./linkedin-connector.js";

describe("LinkedIn Brazil location guard", () => {
  it.each(["Brazil", "Sao Paulo, SP", "Recife e Regiao", "Maceio, Alagoas, Brasil"])("accepts %s", (location) => {
    expect(isBrazilLocation(location)).toBe(true);
  });

  it.each(["Burlington, VT", "United States (Remote)", "Madrid, Spain", null])("rejects %s", (location) => {
    expect(isBrazilLocation(location)).toBe(false);
  });
});
