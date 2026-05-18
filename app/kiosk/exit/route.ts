import { NextResponse } from "next/server";

import { KIOSK_SESSION_COOKIE } from "@/lib/kiosk/session-token";

export async function POST() {
  const response = new NextResponse(null, { status: 204 });

  response.cookies.set({
    name: KIOSK_SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
