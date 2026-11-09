import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { microsoftAuthUrl, microsoftConfigured } from "@/server/microsoftAuth";

/** "Microsoft ile devam et" → rıza ekranına yönlendirir (state çerezi CSRF için). */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!microsoftConfigured()) return NextResponse.redirect(new URL("/?auth=unconfigured", origin));
  const state = crypto.randomUUID();
  (await cookies()).set("ms_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(microsoftAuthUrl(origin, state));
}
