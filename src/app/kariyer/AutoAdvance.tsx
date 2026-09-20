"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { advanceDayAction } from "@/app/actions";

/**
 * Dünya saati (M10): sayfa açılınca kariyeri şimdiki dünya gününe kadar OTOMATİK ilerletir
 * ("Haftayı İlerle" butonu yok). İşlenecek gün varsa (needsSync) bir kez tetikler; uygun turnuva
 * gününde durur (Katıl/Geç). Aynı durumu tekrar tetiklemez (döngü yok).
 */
export function AutoAdvance({ active }: { active: boolean }) {
  const fired = useRef(false);
  const router = useRouter();
  useEffect(() => {
    if (!active) {
      fired.current = false;
      return;
    }
    if (fired.current) return;
    fired.current = true;
    void (async () => {
      await advanceDayAction();
      router.refresh();
    })();
  }, [active, router]);
  return null;
}
