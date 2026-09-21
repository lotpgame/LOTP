"use client";

/**
 * Global hata sınırı (Next.js error boundary). Bir sayfa çökerse kullanıcı beyaz ekran
 * yerine dostça bir mesaj görür; "Tekrar dene" ve tek tıkla otomatik hata bildirme.
 */
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { submitFeedbackAction } from "@/app/actions";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  // Konsola da yaz (geliştirici incelemesi için).
  useEffect(() => {
    console.error(error);
  }, [error]);

  const report = () => {
    start(async () => {
      const fd = new FormData();
      fd.set("message", `[OTOMATIK HATA] ${error.message}${error.digest ? ` (digest: ${error.digest})` : ""}`);
      fd.set("page", pathname);
      fd.set("kind", "error");
      await submitFeedbackAction(fd);
      setSent(true);
    });
  };

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl">😅</div>
      <h1 className="mt-3 text-lg font-semibold">Bir şeyler ters gitti</h1>
      <p className="mt-2 text-sm opacity-70">
        Bu bir hata — senin hatan değil. Test haftasındayız, bunlar olur. İstersen tek tıkla bize bildir,
        biz de düzeltelim.
      </p>
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Tekrar dene
        </button>
        {sent ? (
          <span className="flex items-center px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400">
            Bildirildi 🙏
          </span>
        ) : (
          <button
            onClick={report}
            disabled={pending}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm transition hover:border-emerald-500 disabled:opacity-50 dark:border-white/20"
          >
            {pending ? "Gönderiliyor…" : "Hatayı bildir"}
          </button>
        )}
      </div>
    </div>
  );
}
