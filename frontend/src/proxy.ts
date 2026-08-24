import { NextRequest, NextResponse } from "next/server";
import { authCookie, verifySessionToken } from "@/lib/auth";
import { clientIdentifier, consumeRateLimit, positiveInteger, rateLimitHeaders } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const isMutation = !new Set(["GET", "HEAD", "OPTIONS"]).has(request.method);
  if (isApi) {
    const limit = isMutation ? positiveInteger(process.env.API_WRITE_RATE_LIMIT, 30) : positiveInteger(process.env.API_READ_RATE_LIMIT, 120);
    const decision = consumeRateLimit({ key: `api:${isMutation ? "write" : "read"}:${clientIdentifier(request)}`, limit, windowMs: 60_000, blockMs: 60_000 });
    if (!decision.allowed) return NextResponse.json({ error: "Muitas requisições. Aguarde antes de tentar novamente." }, { status: 429, headers: rateLimitHeaders(decision) });
  }
  const authenticated = await verifySessionToken(request.cookies.get(authCookie.name)?.value);
  if (authenticated) {
    if (request.nextUrl.pathname === "/") return NextResponse.redirect(new URL("/today", request.url));
    return NextResponse.next();
  }

  if (isApi) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const loginUrl = new URL("/login", request.url);
  const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (destination !== "/") loginUrl.searchParams.set("next", destination);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/((?!login|portfolio|api/auth|api/health|_next/static|_next/image|favicon.ico).*)"] };
