import { JobSourcePlatform } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AshbyConnector, GreenhouseConnector, htmlToPlainText, LeverConnector, parsePublicJobPostingHtml, PublicJobPageConnector, SmartRecruitersConnector, WorkableConnector } from "./public-ats-connectors.js";

afterEach(() => vi.unstubAllGlobals());

function context() { return { signal: new AbortController().signal, runId: "test" }; }

describe("public ATS connectors", () => {
  it("normalizes HTML descriptions deterministically", () => {
    expect(htmlToPlainText("<p>React &amp; Node.js</p><ul><li>Remoto</li></ul>")).toBe("React & Node.js Remoto");
  });

  it("maps Greenhouse public JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ jobs: [{ id: 7, title: "Frontend Junior", absolute_url: "https://boards.greenhouse.io/acme/jobs/7", location: { name: "Remoto" }, content: "<p>React &amp; TypeScript</p>" }] }), { status: 200 })));
    const connector = new GreenhouseConnector("acme", "Acme");
    const [reference] = await connector.discover(context());
    expect(reference?.company).toBe("Acme");
    expect(reference && (await connector.enrich(reference)).description).toBe("React & TypeScript");
  });

  it("maps Lever public JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{ id: "abc", text: "Backend Junior", hostedUrl: "https://jobs.lever.co/acme/abc", categories: { location: "Brasil" }, descriptionPlain: "Node.js" }]), { status: 200 })));
    const connector = new LeverConnector("acme", "Acme");
    const [reference] = await connector.discover(context());
    expect(reference?.title).toBe("Backend Junior");
    expect(reference && (await connector.enrich(reference)).description).toBe("Node.js");
  });

  it("maps only listed Ashby public jobs", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ jobs: [{ title: "Full Stack", location: "Remote", jobUrl: "https://jobs.ashbyhq.com/acme/one", descriptionHtml: "<b>Next.js</b>", compensation: "R$ 5.000", isListed: true }, { title: "Oculta", jobUrl: "https://jobs.ashbyhq.com/acme/two", isListed: false }] }), { status: 200 })));
    const connector = new AshbyConnector("acme", "Acme");
    const references = await connector.discover(context());
    expect(references).toHaveLength(1);
    expect((await connector.enrich(references[0]!)).salaryText).toBe("R$ 5.000");
  });

  it("loads SmartRecruiters listing and public detail", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => String(input).includes("/postings/42")
      ? new Response(JSON.stringify({ id: "42", name: "Software Junior", company: { name: "Acme", identifier: "acme" }, location: { city: "Recife", country: "Brasil", remote: true }, applyUrl: "https://jobs.smartrecruiters.com/acme/42", jobAd: { jobDescription: "&lt;p&gt;TypeScript&lt;/p&gt;", qualifications: "React" } }), { status: 200 })
      : new Response(JSON.stringify({ content: [{ id: "42", name: "Software Junior", company: { name: "Acme", identifier: "acme" }, location: { city: "Recife" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const connector = new SmartRecruitersConnector("acme");
    const [reference] = await connector.discover(context());
    expect(reference?.location).toContain("Remoto");
    expect(reference && (await connector.enrich(reference)).description).toContain("TypeScript");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["GUPY", JobSourcePlatform.GUPY, "https://empresa.gupy.io/jobs/123"],
    ["INDEED", JobSourcePlatform.INDEED, "https://br.indeed.com/viewjob?jk=abc"],
  ] as const)("maps %s public JobPosting JSON-LD", async (_label, platform, url) => {
    const html = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "JobPosting", title: "Full Stack Júnior", description: "<p>React &amp; Node.js</p>", url, hiringOrganization: { name: "Acme" }, jobLocationType: "TELECOMMUTE" })}</script>`;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(html, { status: 200, headers: { "content-type": "text/html" } })));
    const connector = new PublicJobPageConnector(platform, url, "Empresa fallback");
    const [reference] = await connector.discover(context());
    expect(reference?.company).toBe("Acme");
    expect(reference?.location).toBe("Remoto");
    expect(reference && (await connector.enrich(reference)).description).toBe("React & Node.js");
  });
  it("rejects non-HTTP URLs from untrusted JSON-LD", () => {
    const html = '<script type="application/ld+json">' + JSON.stringify({ "@type": "JobPosting", title: "Vaga maliciosa", url: "javascript:alert(1)" }) + "</script>";
    expect(parsePublicJobPostingHtml(html, "https://jobs.example/vaga", "Empresa")).toEqual([]);
  });
  it("maps Workable public careers endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ jobs: [{ title: "Full Stack Junior", shortcode: "ABC123", url: "https://apply.workable.com/acme/j/ABC123", description_html: "<p>React &amp; Node.js</p>", location: { location_str: "Brasil - Remoto" } }] }), { status: 200 })));
    const connector = new WorkableConnector("acme", "Acme");
    const [reference] = await connector.discover(context());
    expect(reference?.location).toBe("Brasil - Remoto");
    expect(reference && (await connector.enrich(reference)).description).toBe("React & Node.js");
  });
});
