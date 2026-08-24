import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <main id="conteudo" className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/20"><p className="text-xs font-semibold tracking-[.22em] text-cyan-300 uppercase">Inteligência privada de carreira</p><h1 className="mt-3 text-3xl font-semibold">Job Hunter OS</h1><p className="mt-2 text-sm leading-6 text-slate-400">Acesso restrito ao proprietário. Nenhuma candidatura é liberada por esta autenticação.</p><Suspense fallback={<p className="mt-8 text-sm text-slate-400">Carregando acesso seguro...</p>}><LoginForm /></Suspense></section></main>;
}
