import type { ApprovedCareerContext } from "../career-dna/context.js";

export interface InterviewRoom {
  likelyQuestions: string[];
  starStories: Array<{ situation: string; task: string; action: string; result: string }>;
  factualReminder: string;
}

export function buildInterviewRoom(context: ApprovedCareerContext, requirements: string[]): InterviewRoom {
  const likelyQuestions = requirements.slice(0, 8).map((requirement) => `Conte uma experiência relacionada a: ${requirement}`);
  const starStories = context.evidences.map((evidence) => ({
    situation: evidence.claim,
    task: "Explique o objetivo e sua responsabilidade usando apenas os fatos aprovados.",
    action: "Descreva as ações registradas nas experiências ou projetos aprovados.",
    result: [evidence.result, evidence.metric].filter(Boolean).join(" — "),
  }));
  return { likelyQuestions, starStories, factualReminder: "Não complete lacunas. Se não souber ou não tiver vivido a situação, diga isso com transparência." };
}
