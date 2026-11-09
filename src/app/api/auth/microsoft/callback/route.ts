import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForEmail } from "@/server/microsoftAuth";
import { completeGoogleSignIn } from "@/server/careerService";

/** Microsoft geri dönüşü: state doğrula → kodu e-postaya çevir → giriş yap → ana sayfaya.
 *  completeGoogleSignIn sağlayıcı-bağımsız (e-postayla), Microsoft için de aynı. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const jar = await cookies();
  const saved = jar.get("ms_oauth_state")?.value;
  jar.set("ms_oauth_state", "", { path: "/", maxAge: 0 }); // tek kullanımlık
  if (!code || !state || !saved || state !== saved) {
    return NextResponse.redirect(new URL("/?auth=error", origin));
  }
  try {
    const r = await exchangeCodeForEmail(code, origin);
    if (!r.ok) return NextResponse.redirect(new URL(`/?auth=error&why=${encodeURIComponent(r.reason)}`, origin));
    await completeGoogleSignIn(r.email);
    return NextResponse.redirect(new URL("/", origin));
  } catch (e) {
    console.error("[microsoftAuth] callback hatası:", e);
    return NextResponse.redirect(new URL("/?auth=error&why=exception", origin));
  }
}
