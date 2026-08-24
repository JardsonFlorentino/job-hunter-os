import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "job-hunter-worker" },
  redact: {
    paths: [
      "password", "token", "apiKey", "cookie", "authorization",
      "*.password", "*.token", "*.apiKey", "*.cookie", "*.authorization",
      "req.headers.authorization", "smtp.password", "imap.password",
    ],
    censor: "[REDACTED]",
  },
});

export function errorDetails(error: unknown): { errorType: string; errorMessage: string; stack?: string } {
  if (error instanceof Error) {
    return { errorType: error.name, errorMessage: error.message, ...(error.stack ? { stack: error.stack } : {}) };
  }
  return { errorType: "UnknownError", errorMessage: "Erro desconhecido" };
}
