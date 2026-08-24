export {};

interface ApiResult { ok: boolean; status: number; data: unknown }

async function apiRequest(path: "/opportunity" | "/application-event", method: "GET" | "POST", options: { query?: string; body?: unknown } = {}): Promise<ApiResult> {
  const response: unknown = await chrome.runtime.sendMessage({ type: "JOB_HUNTER_API", path, method, ...options });
  return response as ApiResult;
}

interface AssistantData {
  found: boolean;
  opportunity?: { title: string; company: string; alreadyApplied: boolean; assessment: { decision: string; match_score: number } | null };
  profile: { nome: string; email: string; github?: string | null; linkedin?: string | null; portfolio?: string | null; approvedAnswers?: Record<string, string> };
}

function normalized(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function labelFor(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
  const explicit = field.id ? document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(field.id)}"]`)?.innerText : null;
  return explicit ?? field.closest("label")?.innerText ?? field.getAttribute("aria-label") ?? field.name ?? field.id;
}

function detectRisks(): string[] {
  const text = document.body.innerText.toLowerCase();
  const risks: string[] = [];
  if (document.querySelector("iframe[src*='captcha'], .g-recaptcha, [class*='captcha']")) risks.push("CAPTCHA detectado");
  if (/código de verificação|two.factor|autenticação em duas etapas|mfa/.test(text)) risks.push("MFA/verificação detectada");
  if (document.querySelector("input[type='file']")) risks.push("Upload de arquivo requer revisão");
  if (/redirecionando|candidatar.*site da empresa|external application/.test(text)) risks.push("Fluxo externo detectado");
  return risks;
}

function fillApproved(data: AssistantData): { filled: number; unknownRequired: number } {
  const names = data.profile.nome.trim().split(/\s+/); const firstName = names[0] ?? ""; const lastName = names.slice(1).join(" ");
  const answers: Record<string, string> = { nome: data.profile.nome, name: data.profile.nome, first_name: firstName, firstname: firstName, last_name: lastName, lastname: lastName, email: data.profile.email, github: data.profile.github ?? "", linkedin: data.profile.linkedin ?? "", portfolio: data.profile.portfolio ?? "", ...(data.profile.approvedAnswers ?? {}) };
  let filled = 0; let unknownRequired = 0;
  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select");
  for (const field of fields) {
    if (field.disabled || ("readOnly" in field && field.readOnly) || ["hidden", "password", "file", "submit", "button", "checkbox", "radio"].includes(field instanceof HTMLInputElement ? field.type : "")) continue;
    const keys = [field.name, field.id, field.getAttribute("autocomplete") ?? "", labelFor(field)].map(normalized).filter(Boolean);
    const matched = keys.map((key) => answers[key]).find((value) => value);
    if (matched && !field.value) { field.value = matched; field.dispatchEvent(new Event("input", { bubbles: true })); field.dispatchEvent(new Event("change", { bubbles: true })); filled += 1; }
    else if (field.required && !field.value) unknownRequired += 1;
  }
  return { filled, unknownRequired };
}

async function reportConfirmation(): Promise<void> {
  if (!/candidatura (enviada|recebida)|application (submitted|received)|obrigado por se candidatar/i.test(document.body.innerText)) return;
  await apiRequest("/application-event", "POST", { body: { url: location.href, kind: "SUBMISSION_CONFIRMED" } });
}

function escaped(value: string): string {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}
async function start(): Promise<void> {
  void reportConfirmation().catch(() => undefined);
  const response = await apiRequest("/opportunity", "GET", { query: `url=${encodeURIComponent(location.href)}` });
  if (!response.ok) return;
  const data = response.data as AssistantData;
  const host = document.createElement("div"); host.id = "job-hunter-assistant"; document.documentElement.append(host);
  const shadow = host.attachShadow({ mode: "closed" });
  const panel = document.createElement("aside");
  panel.innerHTML = `<style>:host{all:initial}aside{position:fixed;right:16px;bottom:16px;z-index:2147483647;width:300px;padding:16px;border:1px solid #334155;border-radius:14px;background:#070a10;color:#e2e8f0;font:12px system-ui;box-shadow:0 20px 50px #0008}h2{margin:0 0 8px;color:#67e8f9;font-size:15px}p{margin:5px 0}.warn{color:#fdba74}.good{color:#6ee7b7}button{width:100%;margin-top:10px;padding:9px;border:0;border-radius:8px;background:#22d3ee;color:#082f49;font-weight:700;cursor:pointer}label{display:flex;gap:7px;margin-top:10px;color:#fcd34d}</style><h2>Job Hunter Assistant</h2><p>${data.found ? `${escaped(data.opportunity?.title ?? "Vaga")} · ${escaped(data.opportunity?.company ?? "")}` : "Vaga ainda não catalogada"}</p><p class="${data.opportunity?.alreadyApplied ? "warn" : "good"}">${data.opportunity?.alreadyApplied ? "⚠ Já existe candidatura registrada" : `Score: ${data.opportunity?.assessment?.match_score ?? "não avaliado"}`}</p><p class="warn" id="risks"></p><button id="fill">Preencher fatos aprovados</button><p id="result"></p><label><input id="confirm" type="checkbox"> Revisei todos os campos e autorizo meu envio manual</label>`;
  shadow.append(panel);
  const risks = detectRisks(); const risksNode = panel.querySelector<HTMLElement>("#risks"); if (risksNode) risksNode.textContent = risks.join(" · ");
  panel.querySelector("#fill")?.addEventListener("click", () => { const result = fillApproved(data); const node = panel.querySelector<HTMLElement>("#result"); if (node) node.textContent = `${result.filled} campos preenchidos; ${result.unknownRequired} obrigatórios exigem revisão.`; });
  document.addEventListener("submit", (event) => { const confirmed = panel.querySelector<HTMLInputElement>("#confirm")?.checked === true; if (!confirmed || detectRisks().length > 0) { event.preventDefault(); event.stopImmediatePropagation(); const node = panel.querySelector<HTMLElement>("#result"); if (node) node.textContent = "Envio bloqueado: confirme a revisão e resolva CAPTCHA/MFA/upload."; } }, true);
}

void start().catch(() => undefined);
