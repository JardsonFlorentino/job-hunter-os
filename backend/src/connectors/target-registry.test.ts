import { JobSourcePlatform } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { connectorForTarget } from "./target-registry.js";

describe("career target registry", () => {
  it.each([JobSourcePlatform.GREENHOUSE, JobSourcePlatform.LEVER, JobSourcePlatform.ASHBY, JobSourcePlatform.WORKABLE, JobSourcePlatform.SMARTRECRUITERS])("cria connector suportado para %s", (platform) => {
    expect(connectorForTarget({ name: "Empresa Demo", platform, identifier: "empresa-demo" })?.platform).toBe(platform);
  });
  it("mantém alvo sem identificador ou ATS suportado para revisão", () => {
    expect(connectorForTarget({ name: "Empresa", platform: JobSourcePlatform.COMPANY_SITE, identifier: null })).toBeNull();
  });
});
