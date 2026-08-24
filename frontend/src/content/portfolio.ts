export interface PublicPortfolio {
  name: string;
  role: string;
  summary: string;
  links: Array<{ label: string; href: string }>;
  strengths: Array<{ title: string; description: string }>;
  stack: Array<{ category: string; items: string[] }>;
  architecture: Array<{ step: string; description: string }>;
  highlights: string[];
}

// Este arquivo é a única fonte de dados pessoais da área pública.
// Não importar CandidateProfile, banco operacional ou variáveis de ambiente aqui.
export const publicPortfolio: PublicPortfolio = {
  name: "Jardson Florentino",
  role: "Desenvolvedor Full Stack",
  summary: "Desenvolvedor focado em TypeScript, React, Next.js e Node.js, combinando experiência prática em software com oito anos de atuação em gestão e execução de projetos.",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jardsonflorentino/" },
    { label: "Portfólio", href: "https://kynect.tech" },
  ],
  strengths: [
    { title: "Engenharia de produto", description: "Transformação de um problema real em produto auditável, seguro e orientado a resultados." },
    { title: "Visão de negócios", description: "Experiência anterior em gestão aplicada à priorização, riscos, comunicação e entrega." },
    { title: "Aprendizado contínuo", description: "Formação Full Stack concluída e graduação em Engenharia de Software em andamento." },
  ],
  stack: [
    { category: "Front-end", items: ["TypeScript", "React", "Next.js", "Tailwind CSS"] },
    { category: "Back-end", items: ["Node.js", "Prisma", "PostgreSQL", "APIs REST"] },
    { category: "Qualidade", items: ["Vitest", "Playwright", "ESLint", "TypeScript estrito"] },
    { category: "Infraestrutura", items: ["Docker", "Docker Compose", "GitHub Actions", "Linux"] },
  ],
  architecture: [
    { step: "Descoberta", description: "Conectores coletam oportunidades públicas e preservam a origem." },
    { step: "Inteligência", description: "A IA compara requisitos somente com fatos profissionais aprovados." },
    { step: "Preparação", description: "Currículo e mensagens são versionados para revisão humana." },
    { step: "Acompanhamento", description: "Candidaturas, respostas, testes e entrevistas formam uma trilha auditável." },
  ],
  highlights: [
    "Monorepo TypeScript com frontend, worker e extensão assistida",
    "Deduplicação transacional de vagas e candidaturas",
    "Career DNA factual com aprovação explícita",
    "Kill switch, DRY_RUN e políticas fail-closed",
    "Currículos e mensagens personalizados com versionamento",
    "Dashboard privado protegido por sessão assinada",
  ],
};

