import Link from "next/link";
import { LogoutButton } from "./logout-button";

const links = [["/today", "Visão geral"], ["/discover", "Vagas"], ["/pipeline", "Candidaturas"], ["/competencias", "Competências"], ["/inbox", "Mensagens"], ["/career-dna", "Meu perfil"]] as const;

export function AppNav() {
  return <nav aria-label="Navegação principal" className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-1 [scrollbar-width:thin]">{links.map(([href, label]) => <Link key={href} href={href} className="shrink-0 rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300">{label}</Link>)}<LogoutButton /></nav>;
}
