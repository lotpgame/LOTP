"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * B Faz 1 (ilk sürüm — Faz 3'te gerçek canlı senkrona/polling'e taşınacak): turnuva hâlâ tur tur
 * açılırken sayfayı periyodik tazeler, böylece izleyici manuel yenilemeden ilerlemeyi görür.
 */
export function LiveAutoRefresh({ everyMs = 15_000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);
  return null;
}
