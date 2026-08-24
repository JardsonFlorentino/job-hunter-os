"use client";

import { FormEvent, useState } from "react";

interface SkillItem { id: string; name: string; category: string; level: "BASICO" | "INTERMEDIARIO" | "AVANCADO"; yearsExperience: number | null; approved: boolean }
interface CertificationItem { id: string; name: string; issuer: string; issuedAt: string | null; expiresAt: string | null; credentialUrl: string | null; approved: boolean }
type Editor = { kind: "skill"; item?: SkillItem } | { kind: "certification"; item?: CertificationItem } | null;

async function apiError(response: Response): Promise<string> { const result = await response.json().catch(() => null) as { error?: string } | null; return result?.error ?? "Não foi possível concluir a operação."; }
const dateTime = (date: FormDataEntryValue | null) => typeof date === "string" && date ? new Date(`${date}T12:00:00.000Z`).toISOString() : null;

export function CompetencyManager({ skills, certifications }: { skills: SkillItem[]; certifications: CertificationItem[] }) {
  const [editor, setEditor] = useState<Editor>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const body = editor.kind === "skill" ? {
      resource: "skill", name: form.get("name"), category: form.get("category"), level: form.get("level"),
      years_experience: form.get("years_experience") ? Number(form.get("years_experience")) : null,
    } : {
      resource: "certification", name: form.get("name"), issuer: form.get("issuer"), issued_at: dateTime(form.get("issued_at")),
      expires_at: dateTime(form.get("expires_at")), credential_url: form.get("credential_url") || null,
    };
    const id = editor.item?.id;
    const response = await fetch("/api/career-dna", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { ...body, id } : body) });
    if (!response.ok) { setMessage(await apiError(response)); setBusy(false); return; }
    window.location.reload();
  }

  async function remove(kind: "skill" | "certification", id: string) {
    if (!window.confirm("Deseja remover este item do seu perfil?")) return;
    setBusy(true);
    const response = await fetch("/api/career-dna", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: kind, id }) });
    if (!response.ok) { setMessage(await apiError(response)); setBusy(false); return; }
    window.location.reload();
  }

  async function approve(kind: "skill" | "certification", id: string, approved: boolean) {
    setBusy(true);
    const response = await fetch("/api/career-dna", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: kind, id, approved }) });
    if (!response.ok) { setMessage(await apiError(response)); setBusy(false); return; }
    window.location.reload();
  }

  return <section className="mt-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/[.025] p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Gerenciar desenvolvimento profissional</h2><p className="mt-1 text-xs text-slate-500">Adicione novas stacks e certificações sempre que seu perfil evoluir.</p></div><div className="flex gap-2"><button onClick={() => setEditor({ kind: "skill" })} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950">+ Competência</button><button onClick={() => setEditor({ kind: "certification" })} className="rounded-lg border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-200">+ Certificação</button></div></div>
    {message && <p role="alert" className="mt-3 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-300">{message}</p>}
    {editor && <form onSubmit={submit} className="mt-5 rounded-xl border border-white/10 bg-[#0b1018] p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">{editor.item ? "Editar" : "Cadastrar"} {editor.kind === "skill" ? "competência" : "certificação"}</h3><button type="button" onClick={() => setEditor(null)} className="text-xs text-slate-400">Fechar</button></div>{editor.kind === "skill" ? <SkillFields item={editor.item} /> : <CertificationFields item={editor.item} />}<button disabled={busy} className="mt-4 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Salvando..." : "Salvar para revisão"}</button></form>}
    <div className="mt-5 grid gap-4 lg:grid-cols-2"><ItemList title="Competências cadastradas" empty="Nenhuma competência cadastrada.">{skills.map((item) => <ManagerItem key={item.id} title={item.name} subtitle={`${item.category} · ${item.level}`} approved={item.approved} onEdit={() => setEditor({ kind: "skill", item })} onApprove={() => void approve("skill", item.id, !item.approved)} onRemove={() => void remove("skill", item.id)} />)}</ItemList><ItemList title="Certificações cadastradas" empty="Nenhuma certificação cadastrada.">{certifications.map((item) => <ManagerItem key={item.id} title={item.name} subtitle={item.issuer} approved={item.approved} onEdit={() => setEditor({ kind: "certification", item })} onApprove={() => void approve("certification", item.id, !item.approved)} onRemove={() => void remove("certification", item.id)} />)}</ItemList></div>
  </section>;
}

function SkillFields({ item }: { item?: SkillItem }) { return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label="Competência"><input name="name" required defaultValue={item?.name} /></Field><Field label="Categoria"><input name="category" required defaultValue={item?.category} placeholder="Front-end, Back-end, Gestão..." /></Field><Field label="Nível"><select name="level" required defaultValue={item?.level ?? "BASICO"}><option value="BASICO">Conhecimento inicial</option><option value="INTERMEDIARIO">Aplicação prática</option><option value="AVANCADO">Competência consolidada</option></select></Field><Field label="Anos de experiência"><input name="years_experience" type="number" min="0" max="80" step="0.1" defaultValue={item?.yearsExperience ?? ""} /></Field></div>; }
function CertificationFields({ item }: { item?: CertificationItem }) { return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Field label="Certificação"><input name="name" required defaultValue={item?.name} /></Field><Field label="Instituição emissora"><input name="issuer" required defaultValue={item?.issuer} /></Field><Field label="URL da credencial"><input name="credential_url" type="url" defaultValue={item?.credentialUrl ?? ""} /></Field><Field label="Data de emissão"><input name="issued_at" type="date" defaultValue={item?.issuedAt?.slice(0, 10) ?? ""} /></Field><Field label="Data de validade"><input name="expires_at" type="date" defaultValue={item?.expiresAt?.slice(0, 10) ?? ""} /></Field></div>; }
function Field({ label, children }: { label: string; children: React.ReactElement<{ className?: string }> }) { return <label className="text-xs text-slate-400">{label}<span className="mt-1 block [&>*]:w-full [&>*]:rounded-lg [&>*]:border [&>*]:border-white/10 [&>*]:bg-slate-950 [&>*]:px-3 [&>*]:py-2 [&>*]:text-sm [&>*]:text-slate-100">{children}</span></label>; }
function ItemList({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) { return <div><h3 className="text-sm font-semibold">{title}</h3><div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">{children || <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">{empty}</p>}</div></div>; }
function ManagerItem({ title, subtitle, approved, onEdit, onApprove, onRemove }: { title: string; subtitle: string; approved: boolean; onEdit: () => void; onApprove: () => void; onRemove: () => void }) { return <div className="flex items-center justify-between gap-3 rounded-lg bg-black/20 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{title}</p><p className="truncate text-xs text-slate-500">{subtitle}</p></div><div className="flex shrink-0 gap-1"><button onClick={onApprove} className={`rounded px-2 py-1 text-[10px] ${approved ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{approved ? "Validada" : "Validar"}</button><button onClick={onEdit} className="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-300">Editar</button><button onClick={onRemove} className="rounded bg-rose-400/10 px-2 py-1 text-[10px] text-rose-300">Remover</button></div></div>; }
