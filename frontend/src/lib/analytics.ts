export interface FunnelInput {
  status: string;
  opportunity: {
    sources: Array<{ platform: string }>;
    normalized_title?: string;
    description?: string | null;
    requirements?: Array<{ text: string }>;
  };
  materials?: Array<{ type: string }>;
}

export interface Funnel {
  discovered: number;
  applications: number;
  responses: number;
  tests: number;
  interviews: number;
  offers: number;
  responseRate: number;
  interviewRate: number;
}

export interface ConversionGroup {
  label: string;
  applications: number;
  interviews: number;
  conversion: number;
}

const SUBMITTED = new Set(["SUBMITTED", "TEST", "INTERVIEW", "REJECTED", "OFFER"]);
const RESPONDED = new Set(["TEST", "INTERVIEW", "REJECTED", "OFFER"]);
const INTERVIEWED = new Set(["INTERVIEW", "OFFER"]);
const STACK_TERMS = ["typescript", "react", "next.js", "node.js", "javascript", "postgresql", "tailwind", "python", "java"];

function percentage(numerator: number, denominator: number): number {
  return denominator ? Math.round(numerator / denominator * 10_000) / 100 : 0;
}

export function calculateFunnel(applications: FunnelInput[], discovered: number): Funnel {
  const submitted = applications.filter((item) => SUBMITTED.has(item.status)).length;
  const responses = applications.filter((item) => RESPONDED.has(item.status)).length;
  const tests = applications.filter((item) => item.status === "TEST").length;
  const interviews = applications.filter((item) => INTERVIEWED.has(item.status)).length;
  const offers = applications.filter((item) => item.status === "OFFER").length;
  return { discovered, applications: submitted, responses, tests, interviews, offers, responseRate: percentage(responses, submitted), interviewRate: percentage(interviews, submitted) };
}

function groupConversions(applications: FunnelInput[], labels: (application: FunnelInput) => string[]): ConversionGroup[] {
  const grouped = new Map<string, { applications: number; interviews: number }>();
  for (const application of applications.filter((item) => SUBMITTED.has(item.status))) {
    for (const label of new Set(labels(application).filter(Boolean))) {
      const current = grouped.get(label) ?? { applications: 0, interviews: 0 };
      current.applications += 1;
      if (INTERVIEWED.has(application.status)) current.interviews += 1;
      grouped.set(label, current);
    }
  }
  return [...grouped.entries()].map(([label, value]) => ({ label, ...value, conversion: percentage(value.interviews, value.applications) })).sort((a, b) => b.conversion - a.conversion || b.applications - a.applications || a.label.localeCompare(b.label));
}

export function conversionBreakdowns(applications: FunnelInput[]) {
  return {
    sources: groupConversions(applications, (item) => item.opportunity.sources.map((source) => source.platform)),
    roles: groupConversions(applications, (item) => [item.opportunity.normalized_title ?? "cargo não classificado"]),
    stacks: groupConversions(applications, (item) => {
      const context = `${item.opportunity.description ?? ""} ${(item.opportunity.requirements ?? []).map((requirement) => requirement.text).join(" ")}`.toLowerCase();
      return STACK_TERMS.filter((term) => context.includes(term));
    }),
    materials: groupConversions(applications, (item) => (item.materials ?? []).map((material) => material.type)),
  };
}

export function sourceConversions(applications: FunnelInput[]) {
  return conversionBreakdowns(applications).sources.map(({ label: source, ...value }) => ({ source, ...value }));
}

export function buildConversionRecommendations(groups: ConversionGroup[], dimension: string, minimumSample = 3): string[] {
  const reliable = groups.filter((group) => group.applications >= minimumSample);
  if (!reliable.length) return [`${dimension}: amostra insuficiente; aguarde ao menos ${minimumSample} candidaturas submetidas por grupo.`];
  const best = reliable[0];
  if (!best || best.interviews === 0) return [`${dimension}: ainda não há entrevistas suficientes para recomendar uma mudança.`];
  return [`${dimension}: priorize ${best.label}; ${best.interviews}/${best.applications} candidaturas chegaram a entrevista (${best.conversion}%).`];
}
