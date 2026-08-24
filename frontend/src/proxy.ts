import { NextRequest, NextResponse } from "next/server";
import { authCookie, verifyExtensionToken, verifySessionToken } from "@/lib/auth";
import { extensionCorsHeaders } from "@/lib/extension-cors";
import { clientIdentifier, consumeRateLimit, positiveInteger, rateLimitHeaders } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const isAssistantApi = request.nextUrl.pathname.startsWith("/api/assistant/");
  const corsHeaders = isAssistantApi ? extensionCorsHeaders(request) : {};
  if (isAssistantApi && request.method === "OPTIONS") {
    if (!("Access-Control-Allow-Origin" in corsHeaders)) return NextResponse.json({ error: "Origem da extensão inválida." }, { status: 403 });
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const extensionAuthenticated = isAssistantApi && verifyExtensionToken(request);
  const isMutation = !new Set(["GET", "HEAD", "OPTIONS"]).has(request.method);
  if (isApi) {
    const defaultLimit = extensionAuthenticated ? positiveInteger(process.env.EXTENSION_API_RATE_LIMIT, 60) : isMutation ? positiveInteger(process.env.API_WRITE_RATE_LIMIT, 30) : positiveInteger(process.env.API_READ_RATE_LIMIT, 120);
    const scope = extensionAuthenticated ? "extension" : isMutation ? "write" : "read";
    const decision = consumeRateLimit({ key: `api:${scope}:${clientIdentifier(request)}`, limit: defaultLimit, windowMs: 60_000, blockMs: 60_000 });
    if (!decision.allowed) return NextResponse.json({ error: "Muitas requisições. Aguarde antes de tentar novamente." }, { status: 429, headers: { ...rateLimitHeaders(decision), ...corsHeaders } });
  }

  const sessionAuthenticated = await verifySessionToken(request.cookies.get(authCookie.name)?.value);
  if (sessionAuthenticated || extensionAuthenticated) {
    if (request.nextUrl.pathname === "/") return NextResponse.redirect(new URL("/today", request.url));
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(corsHeaders)) response.headers.set(key, value);
    return response;
  }

  if (isApi) return NextResponse.json({ error: "Não autenticado." }, { status: 401, headers: corsHeaders });

  const loginUrl = new URL("/login", request.url);
  const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (destination !== "/") loginUrl.searchParams.set("next", destination);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/((?!login|portfolio|api/auth|api/health|_next/static|_next/image|favicon.ico).*)"] };