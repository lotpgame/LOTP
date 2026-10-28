"use client";

import { useEffect } from "react";

/** Service worker'ı kaydeder (PWA yüklenebilirliği). Sessizce başarısız olur (destek yoksa sorun değil). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
