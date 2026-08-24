import { createHash } from "node:crypto";

import { JobSourcePlatform } from "@prisma/client";

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function hashText(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  return normalized ? createHash("sha256").update(normalized).digest("hex") : null;
}

export function opportunityFingerprint(input: { company: string; title: string; location?: string | null; description?: string | null }): string {
  const parts = [normalizeText(input.company), normalizeText(input.title), normalizeText(input.location), hashText(input.description) ?? ""];
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export function canonicalizeJobUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";
  const retained = new URLSearchParams();
  for (const key of ["currentJobId", "jobId", "gh_jid", "jk"]) {
    const value = url.searchParams.get(key);
    if (value) retained.set(key, value);
  }
  url.search = retained.toString();
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}

export function detectPlatform(rawUrl: string): JobSourcePlatform {
  const host = new URL(rawUrl).hostname.toLowerCase();
  if (host.includes("github.com")) return JobSourcePlatform.GITHUB;
  if (host.includes("linkedin.com")) return JobSourcePlatform.LINKEDIN;
  if (host.includes("gupy.io")) return JobSourcePlatform.GUPY;
  if (host.includes("indeed.com")) return JobSourcePlatform.INDEED;
  if (host.includes("greenhouse.io")) return JobSourcePlatform.GREENHOUSE;
  if (host.includes("lever.co")) return JobSourcePlatform.LEVER;
  if (host.includes("ashbyhq.com")) return JobSourcePlatform.ASHBY;
  if (host.includes("workable.com")) return JobSourcePlatform.WORKABLE;
  if (host.includes("smartrecruiters.com")) return JobSourcePlatform.SMARTRECRUITERS;
  return JobSourcePlatform.OTHER;
}

export function extractExternalId(rawUrl: string, platform: JobSourcePlatform): string | null {
  const url = new URL(rawUrl);
  if (platform === JobSourcePlatform.LINKEDIN) return url.pathname.match(/\/jobs\/view\/(\d+)/)?.[1] ?? url.searchParams.get("currentJobId");
  if (platform === JobSourcePlatform.GITHUB) return url.pathname.match(/^\/([^/]+\/[^/]+)\/issues\/(\d+)/)?.slice(1).join("#") ?? null;
  if (platform === JobSourcePlatform.INDEED) return url.searchParams.get("jk") ?? url.searchParams.get("jobId");
  const id = url.searchParams.get("jobId") ?? url.searchParams.get("gh_jid") ?? url.pathname.split("/").filter(Boolean).at(-1);
  return id ? `${url.hostname}#${id}` : null;
}
