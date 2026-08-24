export interface CvExperience {
  title: string;
  company?: string;
  period?: string;
  description: string;
  highlights?: string[];
}

export interface CvData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  summary: string;
  headline?: string;
  experiences: CvExperience[];
  skills: string[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function focusOnSoftwareDevelopment(value: string): string {
  return value
    .replace(/\bn8n\b/gi, "integrações de software")
    .replace(/\bno[ -]?code\b/gi, "soluções digitais")
    .replace(/\blow[ -]?code\b/gi, "soluções digitais");
}

function safeText(value: string): string {
  return escapeHtml(focusOnSoftwareDevelopment(value));
}

function normalizeUrl(value: string): string {
  const normalizedValue = value.trim();

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  return `https://${normalizedValue}`;
}

function buildLink(label: string, url: string): string {
  const safeUrl = escapeHtml(normalizeUrl(url));
  const safeLabel = escapeHtml(label);

  return `<a href="${safeUrl}" class="text-slate-700 hover:text-blue-700">${safeLabel}</a>`;
}

function buildContactItems(data: CvData): string {
  const items: string[] = [
    `<a href="mailto:${escapeHtml(data.email)}" class="text-slate-700 hover:text-blue-700">${escapeHtml(data.email)}</a>`,
  ];

  if (data.portfolio?.trim()) items.push(buildLink(data.portfolio.replace(/^https?:\/\//, ""), data.portfolio));

  if (data.phone?.trim()) {
    items.push(`<span>${escapeHtml(data.phone)}</span>`);
  }

  if (data.location?.trim()) {
    items.push(`<span>${escapeHtml(data.location)}</span>`);
  }

  if (data.github?.trim()) {
    items.push(buildLink("GitHub", data.github));
  }

  if (data.linkedin?.trim()) {
    items.push(buildLink("LinkedIn", data.linkedin));
  }

  return items.map((item) => `<li>${item}</li>`).join("");
}

function buildExperiences(experiences: CvExperience[]): string {
  return experiences
    .map((experience) => {
      const metadata = [experience.company, experience.period]
        .filter((value): value is string => Boolean(value?.trim()))
        .map(safeText)
        .join(" · ");

      const highlights = experience.highlights?.length
        ? `<ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">${experience.highlights
            .map((highlight) => `<li>${safeText(highlight)}</li>`)
            .join("")}</ul>`
        : "";

      return `
        <article class="break-inside-avoid border-l-2 border-blue-600 pl-4">
          <div class="flex items-start justify-between gap-4">
            <h3 class="font-semibold text-slate-900">${safeText(experience.title)}</h3>
            ${metadata ? `<span class="text-xs text-slate-500">${metadata}</span>` : ""}
          </div>
          <p class="mt-1 text-sm leading-relaxed text-slate-700">${safeText(experience.description)}</p>
          ${highlights}
        </article>
      `;
    })
    .join("");
}

export function buildHtmlTemplate(data: CvData): string {
  const skills = data.skills
    .map(
      (skill) =>
        `<li class="rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">${safeText(skill)}</li>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Currículo de ${escapeHtml(data.name)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @page { margin: 14mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
  </head>
  <body class="bg-white font-sans text-slate-800">
    <main class="mx-auto max-w-4xl">
      <header class="border-b-2 border-blue-700 pb-4">
        <h1 class="text-4xl font-bold tracking-tight text-slate-950">${escapeHtml(data.name)}</h1>
        <p class="mt-1 text-base font-semibold tracking-wide text-blue-700">${safeText(data.headline ?? "Desenvolvedor de Software")}</p>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          ${buildContactItems(data)}
        </ul>
      </header>

      <section class="mt-6">
        <h2 class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Proposta de valor</h2>
        <p class="mt-2 text-sm leading-relaxed text-slate-700">${safeText(data.summary)}</p>
      </section>

      <section class="mt-6">
        <h2 class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Experiência e impacto</h2>
        <div class="mt-3 space-y-5">
          ${buildExperiences(data.experiences)}
        </div>
      </section>

      <section class="mt-6">
        <h2 class="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Stack principal</h2>
        <ul class="mt-3 flex flex-wrap gap-2">
          ${skills}
        </ul>
      </section>

    </main>
  </body>
</html>`;
}
