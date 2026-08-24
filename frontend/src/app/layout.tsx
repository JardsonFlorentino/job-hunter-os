import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Job Hunter OS", template: "%s | Job Hunter OS" },
  description: "Sistema pessoal de inteligência de oportunidades e candidaturas assistidas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col"><a href="#conteudo" className="sr-only z-50 rounded bg-cyan-300 px-3 py-2 text-slate-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Pular para o conteúdo</a>{children}</body>
    </html>
  );
}
