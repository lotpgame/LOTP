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
    <form ref={formRef} action={action} className="panel flex min-h-12 items-center justify-center gap-2 px-4 py-3" role="status">
      <span className="lamp bg-ink anim-live h-2 w-2" aria-hidden="true" />
      <span className="text-[14px] font-medium">{label}</span>
    </form>
  );
}
