/**
 * Yönetici geri bildirim panosu (sadece sen). Gizli anahtarla korunur:
 * https://.../geribildirim?key=SENIN_ANAHTARIN  (anahtar Vercel env: FEEDBACK_ADMIN_KEY)
 * Anahtar yanlış/eksikse liste gösterilmez — arkadaşların yanlışlıkla göremez.
 */
import { getFeedback } from "@/server/careerService";

export const dynamic = "force-dynamic";

export default async function GeriBildirimPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const adminKey = process.env.FEEDBACK_ADMIN_KEY;

  if (!adminKey || key !== adminKey) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm opacity-60">Bu sayfa özeldir.</p>
      </div>
    );
  }

  const items = await getFeedback(300);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold">Geri bildirimler ({items.length})</h1>
      <p className="mt-1 text-sm opacity-60">Test haftası — en yeni üstte.</p>

      {items.length === 0 ? (
        <p className="mt-8 text-sm opacity-60">Henüz bildirim yok.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((f) => (
            <li
              key={f.id}
              className={`rounded-xl border p-3 text-sm ${
                f.kind === "error"
                  ? "border-red-500/30 bg-red-500/[0.06]"
                  : "border-black/15 bg-black/[0.02] dark:border-white/15 dark:bg-white/[0.03]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs opacity-60">
                <span className={`inline-flex items-center gap-1.5 ${f.kind === "error" ? "font-semibold text-sig-red" : ""}`}>
                  <span className={`lamp h-2 w-2 ${f.kind === "error" ? "lamp-red" : "bg-steel"}`} aria-hidden="true" />
                  {f.kind === "error" ? "HATA" : "fikir"}
                </span>
                {f.playerName && <span>· {f.playerName}</span>}
                {f.page && <span>· {f.page}</span>}
                <span>· {new Date(f.createdAt).toLocaleString("tr-TR")}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap">{f.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
