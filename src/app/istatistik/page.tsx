/**
 * Yönetici canlı istatistik panosu (sadece sen). Gizli anahtarla korunur (geri bildirim panosuyla aynı):
 * https://.../istatistik?key=SENIN_ANAHTARIN   (anahtar Vercel env: FEEDBACK_ADMIN_KEY)
 * Beta gecesi kayıt takibi için — anlık gerçek oyuncu sayısı, son katılanlar, silah/ülke dağılımı.
 * AI rakipler (dünya botları) sayılmaz; yalnız GERÇEK oyuncular.
 */
import { getStats } from "@/server/careerService";
import { ArenaPage } from "@/app/ArenaPage";
import { Flag } from "@/app/kariyer/Flag";

export const dynamic = "force-dynamic";

const WEAPON_TR: Record<string, string> = { FOIL: "Flöre", EPEE: "Epe", SABRE: "Kılıç" };

export default async function IstatistikPage({
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

  const { realCount, accountCount, recent, weaponCounts, countryCounts } = await getStats(25);
  const maxWeapon = Math.max(1, ...weaponCounts.map((w) => w.count));

  return (
    <ArenaPage bg="/img/bg-klasman.webp" className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      {/* Büyük sayı — gerçek oyuncu */}
      <div className="rounded-2xl border border-line bg-black/30 p-6 text-center backdrop-blur">
        <div className="text-[13px] uppercase tracking-wide opacity-60">Gerçek oyuncu</div>
        <div className="num mt-1 text-6xl font-bold leading-none">{realCount}</div>
        <div className="mt-2 text-[13px] opacity-60">
          {accountCount} hesap · {new Date().toLocaleString("tr-TR")}
        </div>
      </div>

      {/* Silah dağılımı */}
      {weaponCounts.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide opacity-70">Silah dağılımı</h2>
          <div className="flex flex-col gap-2">
            {weaponCounts.map((w) => (
              <div key={w.weapon} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-[14px]">{WEAPON_TR[w.weapon] ?? w.weapon}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-white/70" style={{ width: `${(w.count / maxWeapon) * 100}%` }} />
                </span>
                <span className="num w-8 shrink-0 text-right text-[14px]">{w.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ülke dağılımı */}
      {countryCounts.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide opacity-70">Ülke dağılımı</h2>
          <div className="flex flex-wrap gap-2">
            {countryCounts.map((c) => (
              <span key={c.code} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-black/20 px-2.5 py-1 text-[13px]">
                <Flag code={c.code} /> <span className="num font-semibold">{c.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Son katılanlar */}
      <section className="mt-5">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide opacity-70">Son katılanlar</h2>
        {recent.length === 0 ? (
          <p className="text-sm opacity-60">Henüz oyuncu yok. İlk karakteri oluştur! 🤺</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((p, i) => (
              <li key={i} className="flex items-center gap-2.5 rounded-xl border border-line bg-black/20 px-3 py-2 text-[14px]">
                <Flag code={p.nationality?.code ?? ""} />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {p.firstName} {p.lastName}
                </span>
                {p.club?.city && <span className="shrink-0 text-[12px] opacity-60">{p.club.city}</span>}
                <span className="shrink-0 rounded bg-white/10 px-1.5 text-[12px]">{WEAPON_TR[p.weapon] ?? p.weapon}</span>
                <span className="shrink-0 text-[11px] opacity-50">{new Date(p.careerStartDate).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ArenaPage>
  );
}
