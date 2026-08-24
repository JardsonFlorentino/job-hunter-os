import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jardson Florentino — Desenvolvedor Full Stack",
  description: "Estudo de caso do Job Hunter OS: produto Full Stack com TypeScript, Next.js, Node.js, PostgreSQL, IA e automação segura.",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}

