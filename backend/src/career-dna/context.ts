import type { PrismaClient } from "@prisma/client";

export interface ApprovedCareerContext {
  experiences: Array<{ title: string; company: string; description: string; achievements: string[]; technologies: string[] }>;
  projects: Array<{ name: string; summary: string; technologies: string[]; highlights: string[] }>;
  skills: Array<{ name: string; category: string; level: string; yearsExperience: string | null }>;
  educations: Array<{ institution: string; course: string; degree: string | null }>;
  certifications: Array<{ name: string; issuer: string }>;
  languages: Array<{ name: string; level: string }>;
  evidences: Array<{ claim: string; result: string; metric: string | null; sourceUrl: string | null }>;
  approvedAnswers: Array<{ questionKey: string; answer: string }>;
}

export async function loadApprovedCareerContext(prisma: PrismaClient, profileId: string): Promise<ApprovedCareerContext> {
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: profileId },
    select: {
      experiences: { where: { approved: true }, select: { title: true, company: true, description: true, achievements: true, technologies: true } },
      projects: { where: { approved: true }, select: { name: true, summary: true, technologies: true, highlights: true } },
      skills: { where: { approved: true }, select: { name: true, category: true, level: true, years_experience: true } },
      educations: { where: { approved: true }, select: { institution: true, course: true, degree: true } },
      certifications: { where: { approved: true }, select: { name: true, issuer: true } },
      languages: { where: { approved: true }, select: { name: true, level: true } },
      evidences: { where: { approved: true }, select: { claim: true, result: true, metric: true, source_url: true } },
      approved_answers: { where: { approved: true }, select: { question_key: true, answer: true } },
    },
  });

  return {
    experiences: profile.experiences,
    projects: profile.projects,
    skills: profile.skills.map((skill) => ({ name: skill.name, category: skill.category, level: skill.level, yearsExperience: skill.years_experience?.toString() ?? null })),
    educations: profile.educations,
    certifications: profile.certifications,
    languages: profile.languages,
    evidences: profile.evidences.map((evidence) => ({ claim: evidence.claim, result: evidence.result, metric: evidence.metric, sourceUrl: evidence.source_url })),
    approvedAnswers: profile.approved_answers.map((answer) => ({ questionKey: answer.question_key, answer: answer.answer })),
  };
}

export function serializeApprovedCareerContext(context: ApprovedCareerContext): string {
  return JSON.stringify(context, null, 2);
}
