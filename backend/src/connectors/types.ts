import type { JobSourcePlatform } from "@prisma/client";

import type { DiscoveredOpportunityInput } from "../opportunities/opportunity-repository.js";

export interface ConnectorContext {
  signal: AbortSignal;
  runId: string;
}

export interface DiscoveredJobReference {
  externalId: string | null;
  url: string;
  title: string;
  company: string;
  location: string | null;
}

export interface ConnectorHealth {
  healthy: boolean;
  latencyMs: number;
  message: string;
  checkedAt: Date;
}

export interface JobSourceConnector {
  readonly name: string;
  readonly platform: JobSourcePlatform;
  discover(context: ConnectorContext): Promise<DiscoveredJobReference[]>;
  enrich(reference: DiscoveredJobReference, context: ConnectorContext): Promise<DiscoveredOpportunityInput>;
  healthCheck(context: ConnectorContext): Promise<ConnectorHealth>;
  dispose?(): Promise<void>;
}

export interface ConnectorExecutionResult {
  connector: string;
  discovered: number;
  enriched: number;
  persisted: number;
  errors: string[];
}
