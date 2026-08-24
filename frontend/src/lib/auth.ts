const SESSION_COOKIE = "job_hunter_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

interface SessionPayload {
  exp: number;
  sub: "owner";
}

const encoder = new TextEncoder();

function encodeBase64Url(value: Uint8Array | string): string {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET deve possuir pelo menos 32 caracteres.");
  return secret;
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(getAuthSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return encodeBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const size = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < size; index += 1) difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  return difference === 0;
}

export function isPasswordConfigured(): boolean {
  return Boolean(process.env.AUTH_PASSWORD && process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);
}

export function verifyPassword(candidate: string): boolean {
  const expected = process.env.AUTH_PASSWORD;
  return typeof expected === "string" && expected.length > 0 && constantTimeEqual(candidate, expected);
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const payload: SessionPayload = { sub: "owner", exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${await sign(encodedPayload)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [encodedPayload, providedSignature, extra] = token.split(".");
  if (!encodedPayload || !providedSignature || extra) return false;

  try {
    const expectedSignature = await sign(encodedPayload);
    if (!constantTimeEqual(providedSignature, expectedSignature)) return false;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as Partial<SessionPayload>;
    return payload.sub === "owner" && typeof payload.exp === "number" && payload.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export const authCookie = { name: SESSION_COOKIE, maxAge: SESSION_TTL_SECONDS } as const;

export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
