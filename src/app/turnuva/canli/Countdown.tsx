"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sabit geri sayım — maç bitince sonraki aşama (sonuç/çatal) HEMEN açılmaz; süre dolunca
 * server action otomatik gönderilir (atlama yok, kullanıcı tercihi: sabit 10 sn).
 */
export function Countdown({
  seconds,
  action,
  label,
  sub,
}: {
  seconds: number;
  action: () => Promise<void>;
  label: string;
  sub?: string;
}) {
  const [left, setLeft] = useState(seconds);
  const formRef = useRef<HTMLFormElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(id);
          if (!fired.current) {
            fired.current = true;
            formRef.current?.requestSubmit(); // süre doldu → aşamayı ilerlet
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round(((seconds - left) / seconds) * 100);
  return (
    <form ref={formRef} action={action} className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 text-center">
      <div className="text-sm font-medium">{label}</div>
      {sub && <div className="mt-0.5 text-xs opacity-70">{sub}</div>}
      <div className="mt-2 text-3xl font-bold tabular-nums text-sky-600 dark:text-sky-400">{left}</div>
      <div className="mx-auto mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div className="h-full rounded-full bg-sky-500 transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }} />
      </div>
    </form>
  );
}
