export {};

interface ApiMessage {
  type: "JOB_HUNTER_API";
  path: "/opportunity" | "/application-event";
  method: "GET" | "POST";
  query?: string;
  body?: unknown;
}

interface ExtensionSettings { apiBase: string; apiToken: string }
interface ApiResult { ok: boolean; status: number; data: unknown }


function isApiMessage(value: unknown): value is ApiMessage {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.type === "JOB_HUNTER_API" && (record.path === "/opportunity" || record.path === "/application-event") && (record.method === "GET" || record.method === "POST");
}

async function callApi(message: ApiMessage): Promise<ApiResult> {
  const stored = await chrome.storage.local.get(["apiBase", "apiToken"]);
  const settings: ExtensionSettings = {
    apiBase: typeof stored.apiBase === "string" ? stored.apiBase : "https://jobhunter.jardsonflorentino.com.br/api/assistant",
    apiToken: typeof stored.apiToken === "string" ? stored.apiToken : "",
  };
  if (!settings.apiToken || settings.apiToken.length < 32) return { ok: false, status: 401, data: { error: "Configure o token da extensão nas opções." } };
  const base = new URL(settings.apiBase);
  if (base.protocol !== "https:" && base.hostname !== "localhost") return { ok: false, status: 400, data: { error: "A API deve usar HTTPS." } };
  const url = new URL(`${base.toString().replace(/\/$/, "")}${message.path}`);
  if (message.query) url.search = message.query;
  const response = await fetch(url, {
    method: message.method,
    headers: { Authorization: `Bearer ${settings.apiToken}`, ...(message.body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(message.body === undefined ? {} : { body: JSON.stringify(message.body) }),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  return { ok: response.ok, status: response.status, data };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isApiMessage(message)) return false;
  void callApi(message).then(sendResponse).catch((error: unknown) => sendResponse({ ok: false, status: 0, data: { error: error instanceof Error ? error.message : "Falha de conexão." } }));
  return true;
});