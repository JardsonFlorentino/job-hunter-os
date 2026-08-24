"use client";

import { useEffect, useState } from "react";

interface PdfPreviewProps {
  materialId: string;
  title: string;
}

export function PdfPreview({ materialId, title }: PdfPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let currentUrl: string | null = null;

    async function loadPdf(): Promise<void> {
      setObjectUrl(null);
      setError(null);
      try {
        const response = await fetch(`/api/materials/${materialId}`, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Não foi possível carregar o PDF.");
        const blob = await response.blob();
        if (blob.type !== "application/pdf") throw new Error("O material recebido não é um PDF válido.");
        currentUrl = URL.createObjectURL(blob);
        setObjectUrl(currentUrl);
      } catch (loadError: unknown) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Falha ao carregar o PDF.");
      }
    }

    void loadPdf();
    return () => {
      controller.abort();
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [materialId]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <a href={`/api/materials/${materialId}?download=1`} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">Baixar PDF</a>
        {objectUrl && <a href={objectUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Abrir em nova aba</a>}
      </div>
      {error && <div className="grid min-h-72 place-items-center rounded-xl border border-rose-400/20 bg-rose-400/[.04] p-6 text-sm text-rose-200">{error}</div>}
      {!error && !objectUrl && <div className="grid min-h-72 place-items-center rounded-xl border border-white/10 text-sm text-slate-500">Carregando PDF...</div>}
      {objectUrl && <iframe title={title} src={objectUrl} className="h-[70vh] w-full rounded-xl bg-white" />}
    </div>
  );
}