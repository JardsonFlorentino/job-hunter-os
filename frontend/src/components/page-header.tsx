import { AppNav } from "./app-nav";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5"><div><p className="text-xs tracking-[.2em] text-cyan-300 uppercase">{eyebrow}</p><h1 className="mt-1 text-3xl font-semibold">{title}</h1>{description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}</div><AppNav /></header>;
}
