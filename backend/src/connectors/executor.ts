import { ConnectorRunStatus, type PrismaClient } from "@prisma/client";

import { saveOpportunity } from "../opportunities/opportunity-repository.js";
import { saveDiscoveredJob } from "../jobs/job-repository.js";
import type { ConnectorExecutionResult, JobSourceConnector } from "./types.js";

export async function withRetry<T>(operation: () => Promise<T>, options: { attempts: number; baseDelayMs: number; signal?: AbortSignal }): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    if (options.signal?.aborted) throw new Error("Operação cancelada.");
    try { return await operation(); }
    catch (error: unknown) {
      lastError = error;
      if (attempt === options.attempts) break;
      const delay = options.baseDelayMs * 2 ** (attempt - 1);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, delay);
        options.signal?.addEventListener("abort", () => { clearTimeout(timeout); reject(new Error("Operação cancelada.")); }, { once: true });
      });
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function executeConnector(connector: JobSourceConnector, prisma: PrismaClient, signal: AbortSignal): Promise<ConnectorExecutionResult> {
  const run = await prisma.connectorRun.create({ data: { connector: connector.name }, select: { id: true } });
  const result: ConnectorExecutionResult = { connector: connector.name, discovered: 0, enriched: 0, persisted: 0, errors: [] };
  try {
    const health = await withRetry(() => connector.healthCheck({ signal, runId: run.id }), { attempts: 2, baseDelayMs: 500, signal });
    if (!health.healthy) throw new Error(`Health check falhou: ${health.message}`);
    const references = await withRetry(() => connector.discover({ signal, runId: run.id }), { attempts: 3, baseDelayMs: 1_000, signal });
    result.discovered = references.length;
    for (const reference of references) {
      try {
        const enriched = await withRetry(() => connector.enrich(reference, { signal, runId: run.id }), { attempts: 3, baseDelayMs: 1_000, signal });
        result.enriched += 1;
        await saveOpportunity(prisma, enriched);
        await saveDiscoveredJob(prisma, {
          titulo: enriched.title, empresa: enriched.company, link: enriched.url,
          localizacao: enriched.location ?? null, descricao: enriched.description ?? null,
          contato_email: enriched.contactEmail ?? null,
        });
        result.persisted += 1;
      } catch (error: unknown) {
        result.errors.push(error instanceof Error ? `${reference.url}: ${error.message}` : `${reference.url}: erro desconhecido`);
      }
    }
    await prisma.connectorRun.update({ where: { id: run.id }, data: {
      status: result.errors.length === 0 ? ConnectorRunStatus.SUCCESS : ConnectorRunStatus.PARTIAL,
      discovered: result.discovered, enriched: result.enriched, persisted: result.persisted,
      error_count: result.errors.length, error_message: result.errors.join("\n") || null, finished_at: new Date(),
    } });
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await prisma.connectorRun.update({ where: { id: run.id }, data: { status: ConnectorRunStatus.FAILED, error_count: 1, error_message: message, finished_at: new Date() } });
    throw error;
  } finally {
    await connector.dispose?.();
  }
}
