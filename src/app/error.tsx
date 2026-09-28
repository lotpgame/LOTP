"use client";

/**
 * Global hata sınırı (Next.js error boundary). Bir sayfa çökerse kullanıcı beyaz ekran
 * yerine dostça bir mesaj görür; "Tekrar dene" ve tek tıkla otomatik hata bildirme.
 */
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { submitFeedbackAction } from "@/app/actions";
import { Icon } from "@/app/ui/Icon";

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
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-arena-1">
        <Icon name="info" size={26} />
      </span>
      <h1 className="display mt-3 text-[24px]">Bir şeyler ters gitti</h1>
      <p className="mt-2 text-[15px] text-steel">
        Bu bir hata — senin hatan değil. Test haftasındayız, bunlar olur. İstersen tek tıkla bize bildir,
        biz de düzeltelim.
      </p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={() => reset()} className="btn-ink press">
          Tekrar dene
        </button>
        {sent ? (
          <span role="status" className="flex min-h-11 items-center gap-1.5 px-3 text-[15px]">
            <Icon name="check" size={18} />
            Bildirildi, teşekkürler
          </span>
        ) : (
          <button type="button" onClick={report} disabled={pending} className="btn-ghost press disabled:opacity-50">
            {pending ? "Gönderiliyor…" : "Hatayı bildir"}
          </button>
        )}
      </div>
    </div>
  );
}
