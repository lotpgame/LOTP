import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { googleAuthUrl, googleConfigured } from "@/server/googleAuth";

/** "Google ile devam et" → rıza ekranına yönlendirir (state çerezi CSRF için). */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!googleConfigured()) return NextResponse.redirect(new URL("/?auth=unconfigured", origin));
  const state = crypto.randomUUID();
  (await cookies()).set("g_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(googleAuthUrl(origin, state));
}
