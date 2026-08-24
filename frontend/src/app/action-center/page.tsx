"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Action {
  id: string;
  status: string;
  due_at: string | null;
  opportunity: {
    id: string;
    title: string;
    company: { name: string };
    sources: Array<{ id: string; platform: string; canonical_url: string }>;
    assessments: Array<{ match_score: number; strategy: string; gaps: string[] }>;
  };
  materials: Array<{ id: string }>;
  follow_ups: Array<{ id: string; body: string }>;
}

type ActionDecision = "APPROVE" | "IGNORE" | "POSTPONE" | "REGENERATE" | "MARK_MANUAL" | "MARK_SUBMITTED";
const statuses: Record<string, string> = { DRAFT: "Em preparação", MANUAL_ACTION: "Aguardando sua ação" };

export default function ActionCenterPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/action-center", { cache: "no-store" });
    if (!response.ok) throw new Error("Falha ao carregar as pendências.");
    setActions(await response.json() as Action[]);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Falha ao carregar.")), 0);
    return () => clearTimeout(timeout);
  }, [load]);

  async function decide(applicationId: string, action: ActionDecision): Promise<void> {
    setBusyId(applicationId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/action-center", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível registrar a decisão.");
      const feedback: Record<ActionDecision, string> = {
        APPROVE: "Oportunidade aprovada para preparação.",
        IGNORE: "Oportunidade removida da fila.",
        POSTPONE: "Decisão adiada por 24 horas.",
        REGENERATE: "Regeneração de materiais adicionada à fila interna.",
        MARK_MANUAL: "Oportunidade marcada para candidatura manual.",
        MARK_SUBMITTED: "Candidatura manual registrada como enviada.",
      };
      setMessage(feedback[action]);
      await load();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Falha ao registrar decisão.");
    } finally {
      setBusyId(null);
    }
  }

  async function decideFollowUp(id: string, approved: boolean) {
    const response = await fetch("/api/follow-ups", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, approved }) });
    if (!response.ok) throw new Error("Falha ao decidir o acompanhamento.");
    setActions((current) => current.map((action) => ({ ...action, follow_ups: action.follow_ups.filter((item) => item.id !== id) })));
  }

  return <main id="conteudo" className="min-h-screen bg-[#070a10] p-5 text-slate-100 lg:p-8">
    <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-5"><div><p className="text-xs tracking-[.2em] text-orange-300 uppercase">Decisões humanas prioritárias</p><h1 className="mt-1 text-3xl font-semibold">Pendências</h1></div><Link href="/pipeline" className="rounded-lg border border-white/10 px-4 py-2 text-sm">← Candidaturas</Link></header>
    {error && <p className="mx-auto mt-4 max-w-7xl rounded-lg bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
    {message && <p className="mx-auto mt-4 max-w-7xl rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}
    <section className="mx-auto mt-5 grid max-w-7xl gap-3 md:grid-cols-2 xl:grid-cols-3">{actions.map((item) => {
      const assessment = item.opportunity.assessments[0];
      const busy = busyId === item.id;
      return <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
        <div className="flex justify-between"><span className="rounded-full bg-orange-400/10 px-2 py-1 text-[10px] font-bold text-orange-300">{statuses[item.status] ?? item.status}</span><strong className="text-cyan-300">{assessment?.match_score ?? "—"}%</strong></div>
        <h2 className="mt-3 font-semibold">{item.opportunity.title}</h2><p className="text-sm text-slate-400">{item.opportunity.company.name}</p>
        <p className="mt-3 line-clamp-3 text-xs text-slate-500">{assessment?.strategy ?? "Revisão manual necessária."}</p>
        {assessment?.gaps[0] && <p className="mt-2 text-xs text-amber-300">Lacuna: {assessment.gaps[0]}</p>}
        {item.due_at && <p className="mt-2 text-xs text-violet-300">Adiada até {new Date(item.due_at).toLocaleString("pt-BR")}</p>}
        {item.follow_ups.map((followUp) => <div key={followUp.id} className="mt-3 rounded-lg border border-violet-400/20 bg-violet-400/[.06] p-3"><p className="text-xs font-semibold text-violet-300">Acompanhamento aguardando aprovação</p><p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{followUp.body}</p><div className="mt-2 flex gap-2"><button onClick={() => void decideFollowUp(followUp.id, true).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Falha."))} className="rounded bg-emerald-400 px-2 py-1 text-[10px] font-bold text-slate-950">Aprovar</button><button onClick={() => void decideFollowUp(followUp.id, false).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Falha."))} className="rounded border border-rose-400/20 px-2 py-1 text-[10px] text-rose-300">Cancelar</button></div></div>)}
        <div className="mt-4 flex flex-wrap gap-2">{item.opportunity.sources.map((source) => <a key={source.id} href={source.canonical_url} target="_blank" rel="noreferrer" className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950">Abrir vaga</a>)}<Link href={`/revisao/${item.opportunity.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Materiais ({item.materials.length})</Link></div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
          <button disabled={busy} onClick={() => void decide(item.id, "APPROVE")} className="rounded-lg bg-emerald-400/15 px-2 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-40">Aprovar</button>
          <button disabled={busy} onClick={() => void decide(item.id, "POSTPONE")} className="rounded-lg bg-amber-400/10 px-2 py-2 text-xs text-amber-300 disabled:opacity-40">Adiar 24h</button>
          <button disabled={busy} onClick={() => void decide(item.id, "REGENERATE")} className="rounded-lg bg-violet-400/10 px-2 py-2 text-xs text-violet-300 disabled:opacity-40">Regenerar materiais</button>
          <button disabled={busy} onClick={() => void decide(item.id, "MARK_MANUAL")} className="rounded-lg bg-cyan-400/10 px-2 py-2 text-xs text-cyan-300 disabled:opacity-40">Fazer manualmente</button>
          <button disabled={busy} onClick={() => void decide(item.id, "MARK_SUBMITTED")} className="rounded-lg border border-emerald-400/20 px-2 py-2 text-xs text-emerald-300 disabled:opacity-40">Já me candidatei</button>
          <button disabled={busy} onClick={() => void decide(item.id, "IGNORE")} className="rounded-lg border border-rose-400/20 px-2 py-2 text-xs text-rose-300 disabled:opacity-40">Ignorar</button>
        </div>
      </article>;
    })}{actions.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">Nenhuma ação manual pendente.</p>}</section>
  </main>;
}