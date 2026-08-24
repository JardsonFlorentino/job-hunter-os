import { NextRequest, NextResponse } from "next/server";
import { authCookie, createSessionToken, hasSameOrigin, isPasswordConfigured, verifyPassword } from "@/lib/auth";
import { clientIdentifier, consumeRateLimit, positiveInteger, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
  const decision = consumeRateLimit({ key: `login:${clientIdentifier(request)}`, limit: positiveInteger(process.env.AUTH_LOGIN_RATE_LIMIT, 5, 100), windowMs: 15 * 60_000, blockMs: 15 * 60_000 });
  if (!decision.allowed) return NextResponse.json({ error: "Muitas tentativas de acesso. Aguarde antes de tentar novamente." }, { status: 429, headers: rateLimitHeaders(decision) });
  if (!isPasswordConfigured()) return NextResponse.json({ error: "Autenticação ainda não configurada no servidor." }, { status: 503 });

  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (typeof body.password !== "string" || !verifyPassword(body.password)) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json({ error: "Senha inválida." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(authCookie.name, await createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: authCookie.maxAge,
  });
  return response;
}
