import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForEmail } from "@/server/googleAuth";
import { completeGoogleSignIn } from "@/server/careerService";

/** Google geri dönüşü: state doğrula → kodu e-postaya çevir → giriş yap → ana sayfaya. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const jar = await cookies();
  const saved = jar.get("g_oauth_state")?.value;
  jar.set("g_oauth_state", "", { path: "/", maxAge: 0 }); // tek kullanımlık
  if (!code || !state || !saved || state !== saved) {
    return NextResponse.redirect(new URL("/?auth=error", origin));
  }
  const email = await exchangeCodeForEmail(code, origin);
  if (!email) return NextResponse.redirect(new URL("/?auth=error", origin));
  await completeGoogleSignIn(email);
  return NextResponse.redirect(new URL("/", origin));
}
