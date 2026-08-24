import { NextRequest, NextResponse } from "next/server";
import { authCookie, hasSameOrigin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(authCookie.name, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}

