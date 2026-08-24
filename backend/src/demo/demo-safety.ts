const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "postgres_demo"]);

export function assertSafeDemoDatabase(databaseUrl: string | undefined): string {
  if (!databaseUrl) {
    throw new Error("DEMO_DATABASE_URL ausente.");
  }

  const parsed = new URL(databaseUrl);
  const databaseName = parsed.pathname.replace(/^\//, "").toLowerCase();

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("A demonstração exige PostgreSQL.");
  }
  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error("A demonstração só pode usar um PostgreSQL local isolado.");
  }
  if (!databaseName.includes("demo")) {
    throw new Error("O nome do banco de demonstração deve conter 'demo'.");
  }

  return databaseUrl;
}
