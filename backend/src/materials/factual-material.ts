import type { CandidateProfile, Job } from "@prisma/client";

import type { ApprovedCareerContext } from "../career-dna/context.js";
import type { CvData } from "../cv-builder/template.js";
import { normalizeText } from "../opportunities/normalization.js";

function relevance(text: string, jobDescription: string): number {
  const wanted = new Set(normalizeText(jobDescription).split(" ").filter((token) => token.length > 2));
  return normalizeText(text).split(" ").filter((token) => wanted.has(token)).length;
}

export function selectRelevantCareerFacts(context: ApprovedCareerContext, jobDescription: string, limit = 6): ApprovedCareerContext {
  return {
    ...context,
    experiences: [...context.experiences].sort((a, b) => relevance(`${b.title} ${b.description} ${b.technologies.join(" ")}`, jobDescription) - relevance(`${a.title} ${a.description} ${a.technologies.join(" ")}`, jobDescription)).slice(0, limit),
    projects: [...context.projects].sort((a, b) => relevance(`${b.name} ${b.summary} ${b.technologies.join(" ")}`, jobDescription) - relevance(`${a.name} ${a.summary} ${a.technologies.join(" ")}`, jobDescription)).slice(0, limit),
    skills: [...context.skills].sort((a, b) => relevance(b.name, jobDescription) - relevance(a.name, jobDescription)).slice(0, 16),
  };
}

export function buildFactualCvData(profile: CandidateProfile, job: Job, context: ApprovedCareerContext): CvData {
  const selected = selectRelevantCareerFacts(context, job.descricao ?? job.titulo);
  const answer = (key: string) => selected.approvedAnswers.find((item) => item.questionKey === key)?.answer;
  const headline = answer("professional_headline");
  const skills = selected.skills.map((skill) => skill.name);
  const summary = answer("professional_summary") ?? [
    skills.length ? `Competências aprovadas: ${skills.join(", ")}.` : null,
    selected.experiences.length ? `Experiência registrada em ${selected.experiences.map((item) => `${item.title} na ${item.company}`).join("; ")}.` : null,
  ].filter((value): value is string => Boolean(value)).join(" ");
  if (!summary || (!selected.experiences.length && !selected.projects.length)) throw new Error("Career DNA aprovado insuficiente para gerar currículo factual.");
  return {
    name: profile.nome, email: profile.email,
    ...(profile.telefone ? { phone: profile.telefone } : {}),
    ...(profile.localizacao ? { location: profile.localizacao } : {}),
    ...(profile.github ? { github: profile.github } : {}), ...(profile.linkedin ? { linkedin: profile.linkedin } : {}),
    ...(profile.portfolio ? { portfolio: profile.portfolio } : {}),
    ...(headline ? { headline } : {}), summary, skills,
    experiences: [
      ...selected.experiences.map((item) => ({ title: item.title, company: item.company, description: item.description, highlights: item.achievements })),
      ...selected.projects.map((item) => ({ title: `Projeto: ${item.name}`, description: item.summary, highlights: item.highlights })),
    ],
  };
}

export function buildAtsResumeText(data: CvData): string {
  const contact = [data.email, data.phone, data.location, data.github, data.linkedin, data.portfolio].filter(Boolean).join(" | ");
  const experiences = data.experiences.map((item) => [item.title, item.company, item.period].filter(Boolean).join(" - ") + `\n${item.description}${item.highlights?.length ? `\n${item.highlights.map((value) => `- ${value}`).join("\n")}` : ""}`).join("\n\n");
  return `${data.name}\n${data.headline ?? "Desenvolvedor de Software"}\n${contact}\n\nRESUMO\n${data.summary}\n\nEXPERIÊNCIA E PROJETOS\n${experiences}\n\nCOMPETÊNCIAS\n${data.skills.join(", ")}`.trim();
}

export function approvedFormAnswer(context: ApprovedCareerContext, questionKey: string): string | null {
  return context.approvedAnswers.find((answer) => answer.questionKey === questionKey)?.answer ?? null;
}

export const COVER_LETTER_PROMPT = "Gere uma carta curta usando somente CAREER_DNA_APROVADO e requisitos da VAGA. Omita qualquer fato ausente. Retorne apenas a carta.";
export const RECRUITER_MESSAGE_PROMPT = "Gere uma mensagem de até 400 caracteres usando somente CAREER_DNA_APROVADO e VAGA. Não invente experiência. Retorne apenas a mensagem.";
