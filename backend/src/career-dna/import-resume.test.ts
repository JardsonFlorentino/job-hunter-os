import { describe, expect, it } from "vitest";

import { splitResumeSections } from "./import-resume.js";

describe("resume import", () => {
  it("separates known sections without approving or creating facts", () => {
    const sections = splitResumeSections("RESUMO\nPerfil factual\nPROJETOS\nProjeto A\nIDIOMAS\nPortuguês");
    expect(sections.RESUMO).toBe("Perfil factual");
    expect(sections.PROJETOS).toBe("Projeto A");
    expect(sections.IDIOMAS).toBe("Português");
    expect(Object.keys(sections)).toHaveLength(3);
  });
});
