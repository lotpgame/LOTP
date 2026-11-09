/**
 * Hafif Microsoft OAuth 2.0 (Authorization Code) — Google ile AYNI mantık (bkz. googleAuth.ts).
 * next-auth YOK; mevcut çerez/kullanıcı sistemine köprü (completeGoogleSignIn, e-postayla sağlayıcı-bağımsız).
 * Akış: /api/auth/microsoft → Microsoft rızası → /api/auth/microsoft/callback → e-posta → completeGoogleSignIn.
 * "common" tenant → hem kişisel (Outlook/Hotmail) hem iş/okul hesapları. Gizli: MICROSOFT_CLIENT_SECRET (yalnız .env).
 */
const AUTH_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

export function microsoftClientId(): string {
  return process.env.MICROSOFT_CLIENT_ID ?? "";
}
export function microsoftConfigured(): boolean {
  return !!process.env.MICROSOFT_CLIENT_ID && !!process.env.MICROSOFT_CLIENT_SECRET;
}

/** Bu isteğe göre callback URL'i (localhost / vercel otomatik — ekstra env gerekmez). */
export function callbackUrl(origin: string): string {
  return `${origin}/api/auth/microsoft/callback`;
}

/** Microsoft rıza (consent) ekranı URL'i. `state` CSRF için. */
export function microsoftAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: microsoftClientId(),
    redirect_uri: callbackUrl(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    response_mode: "query",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${p.toString()}`;
}

/** Microsoft token endpoint'ine POST — aralıklı ağ/TLS hatalarına karşı birkaç deneme (bkz. googleAuth). */
async function postToken(body: URLSearchParams): Promise<Response | null> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  console.error("[microsoftAuth] token isteği başarısız (ağ/TLS):", lastErr);
  return null;
}

/** Token değişimi sonucu: başarı → e-posta; hata → kısa `reason` (teşhis; gizli değer içermez). */
export type ExchangeResult = { ok: true; email: string } | { ok: false; reason: string };

/** Yetki kodunu token'a çevirir; id_token'dan doğrulanmış e-postayı döndürür. Hata → neden kodu. */
export async function exchangeCodeForEmail(code: string, origin: string): Promise<ExchangeResult> {
  const res = await postToken(
    new URLSearchParams({
      code,
      client_id: microsoftClientId(),
      client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
      redirect_uri: callbackUrl(origin),
      grant_type: "authorization_code",
    }),
  );
  if (!res) return { ok: false, reason: "network" };
  if (!res.ok) {
    let reason = `http_${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; error_description?: string };
      if (body?.error) reason = body.error;
      console.error("[microsoftAuth] token reddi:", res.status, body?.error, body?.error_description);
    } catch {
      /* gövde okunamadı */
    }
    return { ok: false, reason };
  }
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) return { ok: false, reason: "no_id_token" };
  const payloadPart = data.id_token.split(".")[1];
  if (!payloadPart) return { ok: false, reason: "bad_id_token" };
  try {
    const json = Buffer.from(payloadPart.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json) as { email?: string; preferred_username?: string };
    // Microsoft: kişisel hesaplarda `email`; iş/okul hesaplarında çoğu zaman `preferred_username` (UPN = e-posta).
    const email = payload.email ?? payload.preferred_username;
    if (!email || !email.includes("@")) return { ok: false, reason: "no_email" };
    return { ok: true, email: email.toLowerCase() };
  } catch {
    return { ok: false, reason: "decode" };
  }
}
