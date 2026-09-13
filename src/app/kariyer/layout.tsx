import { redirect } from "next/navigation";
import { GENDER_LABEL_TR, WEAPON_LABEL_TR, type Gender, type Weapon } from "@/engine/domain";
import { getCareerHeader } from "@/server/careerService";
import { CareerNav } from "./CareerNav";

// Kariyer verisine bağlı: her istekte taze.
export const dynamic = "force-dynamic";

export default async function KariyerLayout({ children }: LayoutProps<"/kariyer">) {
  const h = await getCareerHeader();
  if (!h) redirect("/");
  // Devam eden canlı turnuva varsa tüm kariyer sayfaları yerine turnuva ekranına götür (immersion).
  if (h.liveTournamentActive) redirect("/turnuva/canli");

  const meta = `${h.code} · ${GENDER_LABEL_TR[h.gender as Gender]} · ${WEAPON_LABEL_TR[h.weapon as Weapon]} · ${h.age} yaş · ${h.categoryId}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <CareerNav name={h.name} meta={meta} />
      {children}
    </div>
  );
}
