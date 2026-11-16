"use client";

/**
 * Denar satın al — Paddle (gerçek para) checkout (kullanıcı kararı 16.11). "Satın Al" → PARENTAL GATE
 * (çocuk kitlesi: bir yetişkin onayı) → Paddle overlay checkout. Ödeme oyuncuya `custom_data.code` ile
 * bağlanır; webhook (/api/paddle-webhook) imzayı doğrulayıp 500 Đ ekler. Paddle yapılandırılmamışsa
 * (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN yoksa) "yakında" rozetine düşer (graceful).
 */
import { useEffect, useRef, useState } from "react";
import { getPlayerCodeAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";

declare global {
  interface Window {
    Paddle?: {
      Environment?: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: { open: (opts: Record<string, unknown>) => void };
    };
  }
}

const TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
const PADDLE_ENV = process.env.NEXT_PUBLIC_PADDLE_ENV; // "sandbox" | "production"

export function BuyDenar({ locale, soonLabel }: { locale: Locale; soonLabel: string }) {
  const [ready, setReady] = useState(false);
  const [gate, setGate] = useState(false); // parental gate açık mı
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const inited = useRef(false);

  useEffect(() => {
    if (!TOKEN || inited.current) return;
    inited.current = true;
    const init = () => {
      try {
        if (PADDLE_ENV === "sandbox") window.Paddle?.Environment?.set("sandbox");
        window.Paddle?.Initialize({ token: TOKEN! });
        setReady(true);
      } catch {
        /* yoksay */
      }
    };
    if (window.Paddle) {
      init();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }, []);

  // Yapılandırılmamış → eski "yakında" rozeti (gerçek ödeme kapalı).
  if (!TOKEN || !PRICE_ID) {
    return <span className="mt-1.5 inline-block rounded bg-arena-2 px-1.5 py-px text-[11px] text-steel">{soonLabel}</span>;
  }

  const openCheckout = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setErr(false);
    try {
      const code = await getPlayerCodeAction();
      if (!code) {
        setErr(true);
        return;
      }
      window.Paddle?.Checkout.open({
        items: [{ priceId: PRICE_ID, quantity: 1 }],
        customData: { code }, // webhook bunu okuyup bu oyuncuya Denar ekler
        settings: { displayMode: "overlay", theme: "dark" },
      });
      setGate(false);
    } catch {
      setErr(true); // ör. domain onaylı değil → "something went wrong" yerine düzgün mesaj
    } finally {
      setBusy(false);
    }
  };

  if (gate) {
    // Parental gate — gerçek para uyarısı + yetişkin onayı.
    return (
      <div className="mt-2 rounded-md border border-sig-red/40 bg-sig-red/[0.06] p-2 text-left">
        <p className="text-[12px] text-steel">{t(locale, "denar.gateNote")}</p>
        {err && <p className="mt-1.5 text-[12px] font-semibold text-sig-red">{t(locale, "denar.buyError")}</p>}
        <div className="mt-2 flex flex-col gap-1.5">
          <button type="button" onClick={openCheckout} disabled={!ready || busy} className="btn-ink press text-[13px] disabled:opacity-50">
            {t(locale, "denar.gateOk")}
          </button>
          <button type="button" onClick={() => { setGate(false); setErr(false); }} className="btn-ghost press text-[13px]">
            {t(locale, "denar.gateCancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setGate(true)}
      disabled={!ready}
      className="press mt-1.5 inline-flex min-h-9 items-center justify-center rounded-md bg-sig-red px-3 text-[13px] font-semibold text-white disabled:opacity-50"
    >
      {t(locale, "denar.buy")}
    </button>
  );
}
