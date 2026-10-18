/**
 * Hafif Google OAuth 2.0 (Authorization Code). next-auth YOK — mevcut çerez/kullanıcı sistemine köprü.
 * Akış: /api/auth/google → Google rızası → /api/auth/google/callback → e-posta → completeGoogleSignIn.
 * Gizli: GOOGLE_CLIENT_SECRET (yalnız .env). Client ID gizli değildir (yönlendirme URL'inde görünür).
 */
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export function googleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID ?? "";
}
export function googleConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

/** Bu isteğe göre callback URL'i (localhost / vercel otomatik — ekstra env gerekmez). */
export function callbackUrl(origin: string): string {
  return `${origin}/api/auth/google/callback`;
}

/** Google rıza (consent) ekranı URL'i. `state` CSRF için. */
export function googleAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: callbackUrl(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${p.toString()}`;
}

/**
 * Google token endpoint'ine POST — aralıklı ağ/TLS hatalarına karşı birkaç deneme yapar.
 * (Bazı yerel ağlarda HTTPS'i inceleyen güvenlik yazılımı TLS el sıkışmasını rastgele keser;
 * prod'da gerekmez ama zararsız ve dayanıklılık katar.) Yanıt alınamazsa null.
 */
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
      lastErr = e; // ağ/TLS hatası — kısa bekle, tekrar dene
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  console.error("[googleAuth] token isteği başarısız (ağ/TLS):", lastErr);
  return null;
}

/** Yetki kodunu token'a çevirir; id_token'dan doğrulanmış e-postayı döndürür (yoksa null). */
export async function exchangeCodeForEmail(code: string, origin: string): Promise<string | null> {
  const res = await postToken(
    new URLSearchParams({
      code,
      client_id: googleClientId(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: callbackUrl(origin),
      grant_type: "authorization_code",
    }),
  );
  if (!res || !res.ok) return null;
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) return null;
  // id_token = JWT (header.payload.signature). Payload'ı çöz (Google'dan geldiği için imza güvenilir).
  const payloadPart = data.id_token.split(".")[1];
  if (!payloadPart) return null;
  try {
    const json = Buffer.from(payloadPart.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json) as { email?: string; email_verified?: boolean };
    if (!payload.email || payload.email_verified === false) return null;
    return payload.email.toLowerCase();
  } catch {
    return null;
  }
}
