import { redirect } from "next/navigation";
import { getCareer } from "@/server/careerService";
import { RankingTable } from "../parts";

export const dynamic = "force-dynamic";

export default async function KlasmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  const myRank = c.ranking.find((r) => r.isHuman)?.position ?? null;

  return (
    <main>
      <h1 className="text-xl font-bold">Klasman</h1>
      <p className="mt-1 text-sm opacity-70">
        Kategori sıralaman: <b>{c.categoryId}</b>. Bu sıralama hem <b>milli takım</b> (ilk 4) hem
        <b> uluslararası davet</b> (ilk 16) kapısını belirler. Her yıl (Q) sonunda sıfırlanır.
      </p>

      <section className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
          <div className="text-xs opacity-60">Sıran</div>
          <div className="font-semibold">{myRank != null ? `#${myRank}` : "—"}</div>
        </div>
        <div className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
          <div className="text-xs opacity-60">Milli Takım</div>
          <div className={`font-semibold ${c.nationalTeam ? "text-emerald-600" : ""}`}>
            {c.nationalTeam ? "✔ ilk 4" : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
          <div className="text-xs opacity-60">Uluslararası</div>
          <div className={`font-semibold ${myRank != null && myRank <= 16 ? "text-emerald-600" : ""}`}>
            {myRank != null && myRank <= 16 ? "✔ ilk 16" : "—"}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <RankingTable ranking={c.ranking} quarter={c.quarter} />
      </section>

      <p className="mt-4 rounded-lg border border-dashed border-black/15 p-3 text-xs opacity-60 dark:border-white/20">
        🌍 <b>Dünya / ülke sıralaması</b> ileride (V2). GDD&apos;de dünya klasmanı, kulüp sıralaması ve
        uluslararası ranking sistemi &quot;Gelecek Sürümler&quot; olarak planlı. V1&apos;de tek klasman:
        kategori sıralaman.
      </p>
    </main>
  );
}
