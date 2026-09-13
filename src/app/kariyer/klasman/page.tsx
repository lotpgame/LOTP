import { redirect } from "next/navigation";
import { GENDER_LABEL_TR, WEAPON_LABEL_TR, type Gender, type Weapon } from "@/engine/domain";
import { getCareer } from "@/server/careerService";
import { KlasmanFilter } from "./KlasmanFilter";

export const dynamic = "force-dynamic";

const AGE_LABEL: Record<string, string> = { SENIOR: "Senior" };

export default async function KlasmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  const myRank = c.ranking.find((r) => r.isHuman)?.position ?? null;
  const ageCat = c.categoryId.split("-")[0];
  const catName = `Türkiye ${GENDER_LABEL_TR[c.gender as Gender]} ${WEAPON_LABEL_TR[c.weapon as Weapon]} ${AGE_LABEL[ageCat] ?? ageCat}`;

  return (
    <main>
      <h1 className="text-xl font-bold">Klasman</h1>
      <p className="mt-1 text-sm">
        {myRank != null ? (
          <>
            <b>{catName}</b> klasmanında <b>{myRank}. sıradasın.</b>
          </>
        ) : (
          <>
            <b>{catName}</b> klasmanında henüz sıralaman yok — ilk turnuvadan sonra oluşur.
          </>
        )}
      </p>
      <p className="mt-1 text-xs opacity-60">
        Bu klasman milli takım (ilk 4) ve uluslararası davet (ilk 16) kapısını belirler; her yıl (Q)
        sonunda sıfırlanır.
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
        <h2 className="mb-2 text-sm font-semibold opacity-80">Klasmanlar</h2>
        <p className="mb-2 text-xs opacity-60">
          Başka bir kategorinin sıralamasına bak (yaş / cinsiyet / silah):
        </p>
        <KlasmanFilter initialCategoryId={c.categoryId} initialRows={c.ranking} />
      </section>

      <p className="mt-4 rounded-lg border border-dashed border-black/15 p-3 text-xs opacity-60 dark:border-white/20">
        🌍 <b>Dünya / ülke sıralaması</b> ileride (V2). GDD&apos;de dünya klasmanı, kulüp sıralaması ve
        uluslararası ranking sistemi &quot;Gelecek Sürümler&quot; olarak planlı.
      </p>
    </main>
  );
}
