"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function logout() {
    setLoading(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { router.replace("/login"); router.refresh(); }
  }
  return <button type="button" onClick={logout} disabled={loading} className="shrink-0 rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-red-300">{loading ? "Saindo..." : "Sair"}</button>;
}
