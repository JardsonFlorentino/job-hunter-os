import { JobSourcePlatform, type CareerPageTarget, type PrismaClient } from "@prisma/client";

import { AshbyConnector, GreenhouseConnector, LeverConnector, PublicJobPageConnector, SmartRecruitersConnector, WorkableConnector } from "./public-ats-connectors.js";
import type { JobSourceConnector } from "./types.js";

export function connectorForTarget(target: Pick<CareerPageTarget, "name" | "platform" | "identifier" | "careers_url">): JobSourceConnector | null {
  if (target.platform === JobSourcePlatform.GUPY || target.platform === JobSourcePlatform.INDEED) return new PublicJobPageConnector(target.platform, target.careers_url, target.name);
  const identifier = target.identifier?.trim();
  if (!identifier) return null;
  switch (target.platform) {
    case JobSourcePlatform.GREENHOUSE: return new GreenhouseConnector(identifier, target.name);
    case JobSourcePlatform.LEVER: return new LeverConnector(identifier, target.name);
    case JobSourcePlatform.ASHBY: return new AshbyConnector(identifier, target.name);
    case JobSourcePlatform.WORKABLE: return new WorkableConnector(identifier, target.name);
    case JobSourcePlatform.SMARTRECRUITERS: return new SmartRecruitersConnector(identifier, target.name);
    default: return null;
  }
}

export async function loadTargetConnectors(prisma: PrismaClient): Promise<JobSourceConnector[]> {
  const targets = await prisma.careerPageTarget.findMany({ where: { enabled: true }, orderBy: [{ priority: "desc" }, { name: "asc" }] });
  return targets.map(connectorForTarget).filter((connector): connector is JobSourceConnector => connector !== null);
}
