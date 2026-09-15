"use client";

import { useEffect, useRef } from "react";

/**
 * Maç bitince sonraki aşamadan önce sabit bekleme (kullanıcı tercihi). Geri sayım sayısı
 * GÖSTERİLMEZ — yalnız "…işleniyor" yazısı; süre dolunca server action otomatik gönderilir.
 */
export function Countdown({ seconds, action, label }: { seconds: number; action: () => Promise<void>; label: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!fired.current) {
        fired.current = true;
        formRef.current?.requestSubmit(); // süre doldu → aşamayı ilerlet
      }
    }, seconds * 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  return (
    <form ref={formRef} action={action} className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 text-center">
      <span className="animate-pulse text-sm font-medium text-sky-700 dark:text-sky-300">{label}</span>
    </form>
  );
}
