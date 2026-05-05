import { NextRequest, NextResponse } from "next/server";

import {
  KIOSK_SESSION_COOKIE,
  verifyKioskToken,
} from "@/lib/kiosk/session-token";

const INVALID_TOKEN_HTML = `<!doctype html>
<html lang="bg">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Невалидна връзка за таблет</title>
  </head>
  <body style="margin:0;min-height:100dvh;display:grid;place-items:center;background:#F7F1EA;color:#2A1D19;font-family:Inter,Arial,sans-serif;">
    <main style="max-width:560px;padding:32px;text-align:center;">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#C24D2C;">HaresvaMi</p>
      <h1 style="margin:0;font-size:36px;line-height:1.05;font-weight:500;">Връзката за таблета е невалидна или изтекла.</h1>
      <p style="margin:18px 0 0;font-size:18px;line-height:1.55;color:#6B5A52;">Отвори таблета отново от dashboard-а.</p>
    </main>
  </body>
</html>`;

function invalidTokenResponse() {
  return new NextResponse(INVALID_TOKEN_HTML, {
    status: 401,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function cookieMaxAge(expiresAt: string) {
  return Math.max(1, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return invalidTokenResponse();
  }

  try {
    const verification = await verifyKioskToken(token);

    if (!verification.valid) {
      return invalidTokenResponse();
    }

    const response = NextResponse.redirect(new URL("/kiosk/scan", request.url));

    response.cookies.set({
      name: KIOSK_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: cookieMaxAge(verification.session.expires_at),
    });

    return response;
  } catch (error) {
    console.error("Unable to connect kiosk session:", error);
    return invalidTokenResponse();
  }
}
