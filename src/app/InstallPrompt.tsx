"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n";

/**
 * "App gibi yükle" nazik uyarısı (yalnız tarayıcıda, yüklü DEĞİLken, bir kez kapatılana dek).
 *  - Android/Chrome: `beforeinstallprompt` yakalanır → tek dokunuşla "Yükle".
 *  - iOS/Safari: otomatik prompt YOK (Apple kısıtı) → "Paylaş → Ana Ekrana Ekle" yönergesi gösterilir.
 * Metinler burada (9 dil) — küçük/özel bir bileşen olduğu için i18n sözlüğünü şişirmeye gerek yok.
 */
type BIPEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };

const TXT: Record<string, { title: string; ios: string; btn: string; close: string }> = {
  tr: { title: "Uygulama gibi oyna", ios: 'Paylaş ⎙ → "Ana Ekrana Ekle"', btn: "Yükle", close: "Kapat" },
  en: { title: "Play like an app", ios: 'Share ⎙ → "Add to Home Screen"', btn: "Install", close: "Close" },
  de: { title: "Wie eine App spielen", ios: 'Teilen ⎙ → "Zum Home-Bildschirm"', btn: "Installieren", close: "Schließen" },
  fr: { title: "Jouer comme une app", ios: 'Partager ⎙ → "Sur l\'écran d\'accueil"', btn: "Installer", close: "Fermer" },
  es: { title: "Juega como una app", ios: 'Compartir ⎙ → "Añadir a inicio"', btn: "Instalar", close: "Cerrar" },
  it: { title: "Gioca come un'app", ios: 'Condividi ⎙ → "Aggiungi a Home"', btn: "Installa", close: "Chiudi" },
  ru: { title: "Играйте как в приложении", ios: 'Поделиться ⎙ → "На экран «Домой»"', btn: "Установить", close: "Закрыть" },
  pt: { title: "Jogue como um app", ios: 'Compartilhar ⎙ → "Tela de Início"', btn: "Instalar", close: "Fechar" },
  zh: { title: "像应用一样游玩", ios: '分享 ⎙ → "添加到主屏幕"', btn: "安装", close: "关闭" },
};

export function InstallPrompt({ locale }: { locale: Locale }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [mode, setMode] = useState<null | "ios" | "android">(null);

  useEffect(() => {
    try {
      const nav = navigator as Navigator & { standalone?: boolean };
      // zaten yüklü (ana ekrandan açılmış) → gösterme
      if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true) return;
      if (localStorage.getItem("lotp.installDismissed")) return;
    } catch {
      return;
    }
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    if (isIOS && isSafari) setMode("ios"); // iOS'ta otomatik prompt yok → yönerge göster
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!mode) return null;
  const txt = TXT[locale] ?? TXT.en;
  const dismiss = () => {
    setMode(null);
    try {
      localStorage.setItem("lotp.installDismissed", "1");
    } catch {}
  };
  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[150] flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-line bg-arena-1/95 px-3 py-2.5 shadow-lg backdrop-blur">
        <span aria-hidden="true" className="text-[22px] leading-none">📱</span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-ink">{txt.title}</div>
          {mode === "ios" && <div className="mt-0.5 text-[13px] text-steel">{txt.ios}</div>}
        </div>
        {mode === "android" && (
          <button type="button" onClick={install} className="btn-ink press h-9 shrink-0 px-3 text-[14px]">
            {txt.btn}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={txt.close}
          className="shrink-0 px-2 text-[18px] leading-none text-steel"
        >
          ×
        </button>
      </div>
    </div>
  );
}
