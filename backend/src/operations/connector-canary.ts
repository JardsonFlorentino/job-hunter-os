import "dotenv/config";

import { executeConnector } from "../connectors/executor.js";
import { GithubConnector } from "../connectors/github-connector.js";
import { LinkedinConnector } from "../connectors/linkedin-connector.js";
import type { JobSourceConnector } from "../connectors/types.js";
import { prisma } from "../prisma/client.js";

const connectorName = process.argv[2]?.trim().toLowerCase();
const searchTerm = process.argv.slice(3).join(" ").trim() || "Desenvolvedor Full Stack Junior";

function connector(): JobSourceConnector {
  if (connectorName === "github") return new GithubConnector();
  if (connectorName === "linkedin") return new LinkedinConnector(searchTerm);
  throw new Error("Informe um conector permitido: github ou linkedin.");
}

async function main(): Promise<void> {
  const selected = connector();
  console.info(`[Canary] Inicio: ${selected.name}. Nenhuma candidatura ou mensagem sera executada.`);
  const result = await executeConnector(selected, prisma, new AbortController().signal);
  console.info(JSON.stringify({
    connector: result.connector,
    discovered: result.discovered,
    enriched: result.enriched,
    processed: result.persisted,
    errors: result.errors.length,
  }));
  if (result.errors.length > 0) process.exitCode = 2;
}

void main()
  .catch((error: unknown) => {
    console.error(`[Canary] Falha: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
