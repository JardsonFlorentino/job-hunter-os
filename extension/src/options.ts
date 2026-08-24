export {};

const apiBase = document.querySelector<HTMLInputElement>("#apiBase");
const apiToken = document.querySelector<HTMLInputElement>("#apiToken");
const statusNode = document.querySelector<HTMLElement>("#status");

async function load(): Promise<void> {
  const stored = await chrome.storage.local.get(["apiBase", "apiToken"]);
  if (apiBase) apiBase.value = typeof stored.apiBase === "string" ? stored.apiBase : "https://jobhunter.jardsonflorentino.com.br/api/assistant";
  if (apiToken) apiToken.value = typeof stored.apiToken === "string" ? stored.apiToken : "";
}

document.querySelector("#save")?.addEventListener("click", () => {
  void (async () => {
    if (!apiBase || !apiToken || !statusNode) return;
    const base = new URL(apiBase.value.trim());
    if (base.protocol !== "https:" && base.hostname !== "localhost") throw new Error("Use HTTPS para a VPS.");
    if (apiToken.value.trim().length < 32) throw new Error("O token deve possuir pelo menos 32 caracteres.");
    await chrome.storage.local.set({ apiBase: base.toString().replace(/\/$/, ""), apiToken: apiToken.value.trim() });
    statusNode.textContent = "Configuração salva localmente nesta extensão.";
  })().catch((error: unknown) => {
    if (statusNode) statusNode.textContent = error instanceof Error ? error.message : "Falha ao salvar.";
  });
});

void load();