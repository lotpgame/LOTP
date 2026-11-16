"use client";

/**
 * Denar satın al — Paddle (gerçek para) checkout (kullanıcı kararı 16.11). "Satın Al" → PARENTAL GATE
 * (çocuk kitlesi: bir yetişkin onayı) → Paddle overlay checkout. Ödeme oyuncuya `custom_data.code` ile
 * bağlanır; webhook (/api/paddle-webhook) imzayı doğrulayıp 500 Đ ekler. Paddle yapılandırılmamışsa
 * (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN yoksa) "yakında" rozetine düşer (graceful).
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerCodeAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";

declare global {
  interface Window {
    Paddle?: {
      Environment?: { set: (env: string) => void };
      Initialize: (opts: { token: string; eventCallback?: (e: { name?: string }) => void }) => void;
      Checkout: { open: (opts: Record<string, unknown>) => void };
    };
  }
}

const TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
const PADDLE_ENV = process.env.NEXT_PUBLIC_PADDLE_ENV; // "sandbox" | "production"

export function BuyDenar({ locale, soonLabel }: { locale: Locale; soonLabel: string }) {
  const router = useRouter();
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
        window.Paddle?.Initialize({
          token: TOKEN!,
          // Ödeme tamamlanınca: webhook Denar'ı DB'ye ekler (async). Kısa gecikmeyle sunucu bileşenlerini
          // tazele → sağ üstteki Denar rozeti yeni bakiyeyi gösterir (yoksa eski değer bayat kalıyordu).
          eventCallback: (e) => {
            if (e?.name === "checkout.completed") setTimeout(() => router.refresh(), 2500);
          },
        });
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
    return <span className="inline-block self-start rounded bg-arena-2 px-1.5 py-px text-[11px] text-steel">{soonLabel}</span>;
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
      // Denar penceresi native <dialog> (top-layer) → Paddle overlay'in ÜSTünde kalıyordu (order summary altta
      // görünüyordu). Checkout açmadan önce pencereyi kapat → overlay en üstte, temiz görünür (kullanıcı 17.11).
      document.querySelector<HTMLDialogElement>("dialog.modal[open]")?.close();
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
      <div className="rounded-md border border-sig-red/40 bg-sig-red/[0.06] p-2 text-left">
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
      className="press flex min-h-10 w-full items-center justify-center rounded-md bg-sig-red px-3 text-[14px] font-semibold text-white disabled:opacity-50"
    >
      {t(locale, "denar.buy")}
    </button>
  );
}
