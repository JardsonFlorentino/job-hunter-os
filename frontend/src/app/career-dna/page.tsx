"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Resource = "experience" | "project" | "skill" | "education" | "certification" | "language" | "blocked" | "answer" | "evidence";
type ApprovableResource = Exclude<Resource, "blocked">;

interface DnaItem {
  id: string;
  approved?: boolean;
  title?: string;
  company?: string;
  name?: string;
  institution?: string;
  course?: string;
  issuer?: string;
  category?: string;
  level?: string;
  type?: string;
  value?: string;
  question?: string;
  summary?: string;
  description?: string;
  answer?: string;
  claim?: string;
  result?: string;
  metric?: string;
  question_key?: string;
  reason?: string | null;
  url?: string | null;
  repository?: string | null;
  credential_url?: string | null;
  source_url?: string | null;
  source_note?: string | null;
  degree?: string | null;
  years_experience?: string | null;
  achievements?: string[];
  technologies?: string[];
  highlights?: string[];
}

interface CareerDna {
  nome: string;
  email: string;
  telefone: string | null;
  localizacao: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  pretensao_clt: string | null;
  pretensao_pj: string | null;
  anos_experiencia: number;
  updated_at: string;
  experiences: DnaItem[];
  projects: DnaItem[];
  skills: DnaItem[];
  educations: DnaItem[];
  certifications: DnaItem[];
  languages: DnaItem[];
  blocked_items: DnaItem[];
  approved_answers: DnaItem[];
  evidences: DnaItem[];
  job_preference: JobPreference | null;
  resume_imports: ResumeImport[];
}

interface ResumeImport {
  id: string;
  original_name: string;
  status: "PENDING_REVIEW" | "REVIEWED" | "REJECTED";
  created_at: string;
  proposals: Record<string, string>;
}

interface JobPreference {
  target_titles: string[];
  target_stacks: string[];
  target_seniorities: string[];
  contract_types: string[];
  work_modes: string[];
  locations: string[];
  minimum_clt: string | null;
  minimum_pj: string | null;
  accepts_international: boolean;
}

interface FieldDefinition {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: string[];
}

const RESOURCE_CONFIG: Record<Resource, { label: string; collection: keyof CareerDna; fields: FieldDefinition[] }> = {
  experience: { label: "Experiência", collection: "experiences", fields: [
    { name: "title", label: "Cargo" }, { name: "company", label: "Empresa" },
    { name: "description", label: "Responsabilidades e contexto", type: "textarea" },
    { name: "achievements", label: "Resultados (separe por vírgulas)" }, { name: "technologies", label: "Tecnologias (separe por vírgulas)" },
  ] },
  project: { label: "Projeto", collection: "projects", fields: [
    { name: "name", label: "Nome" }, { name: "summary", label: "Problema, solução e impacto", type: "textarea" },
    { name: "url", label: "URL (opcional)" }, { name: "repository", label: "Repositório (opcional)" },
    { name: "technologies", label: "Tecnologias (separe por vírgulas)" }, { name: "highlights", label: "Destaques (separe por vírgulas)" },
  ] },
  skill: { label: "Competência", collection: "skills", fields: [
    { name: "name", label: "Competência" }, { name: "category", label: "Categoria" },
    { name: "level", label: "Nível", type: "select", options: ["BASICO", "INTERMEDIARIO", "AVANCADO"] },
    { name: "years_experience", label: "Anos de experiência", type: "number" },
  ] },
  education: { label: "Formação", collection: "educations", fields: [
    { name: "institution", label: "Instituição" }, { name: "course", label: "Curso" },
    { name: "degree", label: "Grau (opcional)" }, { name: "description", label: "Descrição (opcional)", type: "textarea" },
  ] },
  certification: { label: "Certificação", collection: "certifications", fields: [
    { name: "name", label: "Certificação" }, { name: "issuer", label: "Emissor" },
    { name: "credential_url", label: "URL da credencial (opcional)" },
  ] },
  language: { label: "Idioma", collection: "languages", fields: [
    { name: "name", label: "Idioma" }, { name: "level", label: "Nível", type: "select", options: ["BASICO", "INTERMEDIARIO", "AVANCADO", "FLUENTE", "NATIVO"] },
  ] },
  blocked: { label: "Bloqueio", collection: "blocked_items", fields: [
    { name: "type", label: "Tipo", type: "select", options: ["EMPRESA", "TECNOLOGIA", "LOCALIZACAO", "CONDICAO"] },
    { name: "value", label: "Valor bloqueado" }, { name: "reason", label: "Motivo (opcional)" },
  ] },
  answer: { label: "Resposta aprovada", collection: "approved_answers", fields: [
    { name: "question_key", label: "Chave (ex.: pretensao_salarial)" }, { name: "question", label: "Pergunta" },
    { name: "answer", label: "Resposta factual", type: "textarea" },
  ] },
  evidence: { label: "Resultado e evidência", collection: "evidences", fields: [
    { name: "claim", label: "Afirmação verificável" }, { name: "result", label: "Resultado alcançado", type: "textarea" },
    { name: "metric", label: "Métrica (opcional)" }, { name: "source_url", label: "URL da evidência (opcional)" },
    { name: "source_note", label: "Como verificar (opcional)", type: "textarea" },
  ] },
};

function csv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function itemTitle(item: DnaItem): string {
  return item.title ?? item.name ?? item.course ?? item.question ?? item.claim ?? item.value ?? "Item factual";
}

function itemSubtitle(item: DnaItem): string {
  return item.company ?? item.institution ?? item.issuer ?? item.category ?? item.level ?? item.type ?? item.summary ?? item.description ?? item.result ?? item.answer ?? "";
}

async function requestError(response: Response): Promise<string> {
  try { const body = await response.json() as { error?: string }; return body.error ?? `HTTP ${response.status}`; }
  catch { return `HTTP ${response.status}`; }
}

export default function CareerDnaPage() {
  const [dna, setDna] = useState<CareerDna | null>(null);
  const [resource, setResource] = useState<Resource>("experience");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/career-dna", { cache: "no-store" });
    if (!response.ok) throw new Error(await requestError(response));
    setDna(await response.json() as CareerDna);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Falha ao carregar.")), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const stats = useMemo(() => {
    if (!dna) return { total: 0, approved: 0 };
    const items = Object.values(RESOURCE_CONFIG).flatMap((config) => dna[config.collection] as DnaItem[]);
    return { total: items.length, approved: items.filter((item) => item.approved).length };
  }, [dna]);

  function payload(): Record<string, unknown> {
    const base: Record<string, unknown> = { resource };
    for (const field of RESOURCE_CONFIG[resource].fields) {
      const value = draft[field.name]?.trim() ?? "";
      if (["achievements", "technologies", "highlights"].includes(field.name)) base[field.name] = csv(value);
      else if (field.type === "number") base[field.name] = value ? Number(value) : null;
      else if (["url", "repository", "credential_url", "source_url", "source_note", "metric", "degree", "description", "reason"].includes(field.name) && !value) base[field.name] = null;
      else base[field.name] = value;
    }
    return base;
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/career-dna", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload(), ...(editingId ? { id: editingId } : {}) }) });
      if (!response.ok) throw new Error(await requestError(response));
      setDraft({}); setEditingId(null); await load(); setMessage("Fato salvo como pendente de aprovação.");
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Falha ao salvar."); }
    finally { setBusy(false); }
  }

  async function approve(resourceName: ApprovableResource, item: DnaItem): Promise<void> {
    const response = await fetch("/api/career-dna", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: resourceName, id: item.id, approved: !item.approved }) });
    if (!response.ok) throw new Error(await requestError(response));
    await load();
  }

  async function remove(resourceName: Resource, id: string): Promise<void> {
    const response = await fetch("/api/career-dna", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: resourceName, id }) });
    if (!response.ok) throw new Error(await requestError(response));
    await load();
  }

  function edit(resourceName: Resource, item: DnaItem): void {
    const nextDraft: Record<string, string> = {};
    for (const field of RESOURCE_CONFIG[resourceName].fields) {
      const value = item[field.name as keyof DnaItem];
      nextDraft[field.name] = Array.isArray(value) ? value.join(", ") : value == null ? "" : String(value);
    }
    setResource(resourceName); setDraft(nextDraft); setEditingId(item.id);
    setMessage("Editando item. Ao salvar, ele voltará para revisão.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <main className="min-h-screen bg-[#070a10] p-5 text-slate-100 lg:p-8">
    <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-5">
      <div><p className="text-xs tracking-[.2em] text-cyan-300 uppercase">Base factual aprovada</p><h1 className="mt-1 text-3xl font-semibold">Meu perfil</h1><p className="mt-2 text-sm text-slate-400">A IA só poderá usar fatos que você revisar e aprovar.</p></div>
      <Link href="/today" className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">← Visão geral</Link>
    </header>

    <div className="mx-auto mt-5 grid max-w-7xl gap-4 sm:grid-cols-3">
      <Metric label="Fatos cadastrados" value={stats.total} /><Metric label="Fatos aprovados" value={stats.approved} accent /><Metric label="Pendentes de revisão" value={stats.total - stats.approved} />
    </div>
    {message && <div className="mx-auto mt-4 max-w-7xl rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{message}</div>}

    {dna?.resume_imports?.map((resume) => <section key={resume.id} className="mx-auto mt-4 max-w-7xl rounded-xl border border-amber-400/20 bg-amber-400/[.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-amber-300">CURRÍCULO IMPORTADO — REVISÃO NECESSÁRIA</p><p className="mt-1 text-sm">{resume.original_name}</p><p className="mt-1 text-xs text-slate-500">{Object.keys(resume.proposals).length} seções extraídas. Nenhum fato foi aprovado automaticamente.</p></div><span className="rounded-full bg-amber-400/15 px-3 py-1 text-[10px] font-bold text-amber-300">{resume.status}</span></div>
    </section>)}

    <div className="mx-auto mt-5 max-w-7xl">
      {dna && <ProfileEditor key={`${dna.updated_at ?? "profile"}-${dna.email}`} profile={dna} onSaved={load} onMessage={setMessage} />}
    </div>

    <div className="mx-auto mt-5 max-w-7xl">
      <PreferenceEditor key={JSON.stringify(dna?.job_preference ?? null)} preference={dna?.job_preference ?? null} onSaved={load} onMessage={setMessage} />
    </div>

    <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-white/10 bg-white/[.025] p-4">
        <label className="text-xs font-semibold text-slate-400">Tipo de informação</label>
        <select value={resource} onChange={(event) => { setResource(event.target.value as Resource); setDraft({}); }} className="mt-2 w-full rounded-lg border border-white/10 bg-[#111722] px-3 py-2 text-sm">
          {Object.entries(RESOURCE_CONFIG).map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}
        </select>
        <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
          {RESOURCE_CONFIG[resource].fields.map((field) => <label key={field.name} className="block"><span className="mb-1 block text-[11px] text-slate-400">{field.label}</span>
            {field.type === "textarea" ? <textarea required={!field.label.includes("opcional")} value={draft[field.name] ?? ""} onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })} rows={3} className="w-full rounded-lg border border-white/10 bg-[#0b1018] px-3 py-2 text-sm outline-none focus:border-cyan-400/40" /> : field.type === "select" ? <select required value={draft[field.name] ?? ""} onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0b1018] px-3 py-2 text-sm"><option value="">Selecione</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : <input required={!field.label.includes("opcional") && !["achievements", "technologies", "highlights", "years_experience"].includes(field.name)} type={field.type ?? "text"} value={draft[field.name] ?? ""} onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0b1018] px-3 py-2 text-sm outline-none focus:border-cyan-400/40" />}
          </label>)}
          <button disabled={busy} className="w-full rounded-lg bg-cyan-400 px-3 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Salvando…" : editingId ? "Salvar alteração" : "Salvar para revisão"}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setDraft({}); }} className="w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">Cancelar edição</button>}
        </form>
      </aside>

      <section className="space-y-5">
        {(Object.entries(RESOURCE_CONFIG) as Array<[Resource, (typeof RESOURCE_CONFIG)[Resource]]>).map(([key, config]) => {
          const items = dna ? dna[config.collection] as DnaItem[] : [];
          return <article key={key} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{config.label}</h2><span className="text-xs text-slate-500">{items.length}</span></div>
            <div className="grid gap-2 md:grid-cols-2">{items.map((item) => <div key={item.id} className="rounded-xl border border-white/8 bg-[#111722] p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{itemTitle(item)}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{itemSubtitle(item)}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${item.approved ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>{item.approved ? "APROVADO" : "REVISAR"}</span></div>
              <div className="mt-3 flex flex-wrap gap-2">{key !== "blocked" && <button onClick={() => void approve(key as ApprovableResource, item).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Falha ao aprovar."))} className="rounded-md border border-emerald-400/20 px-2 py-1 text-[10px] text-emerald-300">{item.approved ? "Retirar aprovação" : "Aprovar fato"}</button>}<button onClick={() => edit(key, item)} className="rounded-md border border-cyan-400/20 px-2 py-1 text-[10px] text-cyan-300">Editar</button><button onClick={() => void remove(key, item.id).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Falha ao remover."))} className="rounded-md border border-rose-400/20 px-2 py-1 text-[10px] text-rose-300">Remover</button></div>
            </div>)}{items.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-600">Nenhum item cadastrado.</div>}</div>
          </article>;
        })}
      </section>
    </div>
  </main>;
}

function ProfileEditor({ profile, onSaved, onMessage }: { profile: CareerDna; onSaved: () => Promise<void>; onMessage: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: profile.nome, email: profile.email, telefone: profile.telefone ?? "", localizacao: profile.localizacao ?? "",
    github: profile.github ?? "", linkedin: profile.linkedin ?? "", portfolio: profile.portfolio ?? "",
    pretensao_clt: profile.pretensao_clt ?? "", pretensao_pj: profile.pretensao_pj ?? "", anos_experiencia: String(profile.anos_experiencia),
  });

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      ...form,
      pretensao_clt: form.pretensao_clt || null,
      pretensao_pj: form.pretensao_pj || null,
      anos_experiencia: Number(form.anos_experiencia),
    }) });
    if (!response.ok) throw new Error(await requestError(response));
    await onSaved(); setOpen(false); onMessage("Dados pessoais e de contato atualizados.");
  }

  const fields: Array<[keyof typeof form, string, string]> = [
    ["nome", "Nome", "text"], ["email", "E-mail", "email"], ["telefone", "Telefone", "tel"],
    ["localizacao", "Localização", "text"], ["github", "GitHub", "url"], ["linkedin", "LinkedIn", "url"],
    ["portfolio", "Portfólio", "url"], ["pretensao_clt", "Pretensão CLT", "number"],
    ["pretensao_pj", "Pretensão PJ", "number"], ["anos_experiencia", "Anos em desenvolvimento", "number"],
  ];

  return <section className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
    <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Identidade profissional</h2><p className="mt-1 text-xs text-slate-500">Dados usados no currículo e nos materiais de candidatura.</p></div><button onClick={() => setOpen(!open)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">{open ? "Fechar" : "Editar perfil"}</button></div>
    {open && <form onSubmit={(event) => void save(event).catch((error: unknown) => onMessage(error instanceof Error ? error.message : "Falha ao salvar."))} className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {fields.map(([key, label, type]) => <label key={key} className="text-xs text-slate-400">{label}<input required={["nome", "email", "anos_experiencia"].includes(key)} type={type} min={type === "number" ? 0 : undefined} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1018] px-3 py-2 text-sm text-slate-100" /></label>)}
      <button className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 md:col-span-2 lg:col-span-3">Salvar perfil</button>
    </form>}
  </section>;
}

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className={`rounded-xl border px-4 py-3 ${accent ? "border-emerald-400/20 bg-emerald-400/10" : "border-white/10 bg-white/[.025]"}`}><p className="text-[10px] tracking-wider text-slate-500 uppercase">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

function PreferenceEditor({ preference, onSaved, onMessage }: { preference: JobPreference | null; onSaved: () => Promise<void>; onMessage: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(() => preference ? {
    target_titles: preference.target_titles.join(", "), target_stacks: preference.target_stacks.join(", "),
    target_seniorities: preference.target_seniorities.join(", "), contract_types: preference.contract_types.join(", "),
    work_modes: preference.work_modes.join(", "), locations: preference.locations.join(", "),
    minimum_clt: preference.minimum_clt ?? "", minimum_pj: preference.minimum_pj ?? "",
  } : {} as Record<string, string>);
  const [international, setInternational] = useState(preference?.accepts_international ?? false);

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const list = (key: string) => csv(form[key] ?? "");
    const response = await fetch("/api/career-dna", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      resource: "preference", target_titles: list("target_titles"), target_stacks: list("target_stacks"),
      target_seniorities: list("target_seniorities"), contract_types: list("contract_types"), work_modes: list("work_modes"), locations: list("locations"),
      minimum_clt: form.minimum_clt ? Number(form.minimum_clt) : null, minimum_pj: form.minimum_pj ? Number(form.minimum_pj) : null,
      accepts_international: international,
    }) });
    if (!response.ok) throw new Error(await requestError(response));
    await onSaved(); setOpen(false); onMessage("Preferências de busca atualizadas.");
  }

  return <section className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[.04] p-4">
    <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Preferências de busca</h2><p className="mt-1 text-xs text-slate-500">Cargos, stack, modelo de trabalho e limites usados para priorizar oportunidades.</p></div><button onClick={() => setOpen(!open)} className="rounded-lg border border-cyan-400/20 px-3 py-2 text-xs text-cyan-300">{open ? "Fechar" : "Configurar"}</button></div>
    {open && <form onSubmit={(event) => void save(event).catch((error: unknown) => onMessage(error instanceof Error ? error.message : "Falha ao salvar."))} className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {[["target_titles", "Cargos desejados"], ["target_stacks", "Stacks"], ["target_seniorities", "Senioridades"], ["contract_types", "Contratos"], ["work_modes", "Modalidades"], ["locations", "Localidades"]].map(([key, label]) => <label key={key} className="text-xs text-slate-400">{label}<input value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} placeholder="Separe por vírgulas" className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1018] px-3 py-2 text-sm text-slate-100" /></label>)}
      <label className="text-xs text-slate-400">Mínimo CLT<input type="number" min="0" value={form.minimum_clt ?? ""} onChange={(event) => setForm({ ...form, minimum_clt: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1018] px-3 py-2 text-sm text-slate-100" /></label>
      <label className="text-xs text-slate-400">Mínimo PJ<input type="number" min="0" value={form.minimum_pj ?? ""} onChange={(event) => setForm({ ...form, minimum_pj: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1018] px-3 py-2 text-sm text-slate-100" /></label>
      <label className="flex items-center gap-2 self-end py-2 text-xs text-slate-300"><input type="checkbox" checked={international} onChange={(event) => setInternational(event.target.checked)} /> Aceita vagas internacionais</label>
      <button className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 md:col-span-2 lg:col-span-3">Salvar preferências</button>
    </form>}
  </section>;
}
