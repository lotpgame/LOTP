/**
 * Paddle webhook — gerçek-para ödeme bildirimi (kullanıcı kararı 16.11). Paddle, ödeme tamamlanınca buraya
 * POST atar; biz İMZAYI doğrulayıp (PADDLE_WEBHOOK_SECRET) ilgili oyuncuya Denar ekleriz. ÇİFT webhook'ta
 * çift kredi yok (creditPaddlePurchase idempotent). Ham gövde imza için şart → request.text() kullanılır.
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { DENAR_PACKAGES } from "@/engine/ads";
import { creditPaddlePurchase } from "@/server/careerService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaddleEvent = {
  event_type?: string;
  data?: {
    id?: string;
    currency_code?: string;
    custom_data?: { code?: string } | null;
    details?: { totals?: { grand_total?: string } };
  };
};

/** Paddle-Signature: "ts=...;h1=..." → HMAC-SHA256(`${ts}:${rawBody}`, secret) === h1 (timing-safe). */
function verifySignature(rawBody: string, sigHeader: string | null, secret: string): boolean {
  if (!sigHeader) return false;
  const parts: Record<string, string> = {};
  for (const seg of sigHeader.split(";")) {
    const [k, v] = seg.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(h1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 500 });

  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("paddle-signature"), secret)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(raw) as PaddleEvent;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  // Yalnız TAMAMLANMIŞ (ödenmiş) işlemi işle.
  if (event.event_type === "transaction.completed") {
    const data = event.data ?? {};
    const transactionId = data.id;
    const code = data.custom_data?.code; // checkout'ta geçirdiğimiz oyuncu lisans kodu
    if (transactionId && code) {
      const denar = DENAR_PACKAGES[0]?.denar ?? 500; // tek paket = 500 Đ
      const minor = Number(data.details?.totals?.grand_total ?? "0");
      const amount = `${data.currency_code ?? ""} ${(minor / 100).toFixed(2)}`.trim(); // ör. "GBP 4.99"
      await creditPaddlePurchase({ transactionId, playerCode: code, denar, amount });
    }
  }

  // Paddle 2xx bekler; aksi halde tekrar dener (idempotency bu yüzden şart).
  return NextResponse.json({ ok: true });
}
