"use server";

/**
 * Server Actions — UI'nin çağırdığı sunucu fonksiyonları (Next 16). Kritik hesap sunucuda;
 * girdi Career Service içinde Zod ile doğrulanır (GDD güvenlik). Her aksiyon POST ile çalışır.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TACTICS, type Tactic } from "@/engine/combat";
import { TRAINING_TYPES, type TrainingType } from "@/engine/training";
import {
  advanceDay,
  attendTournament,
  createCareer,
  enterBracket,
  hasCareer,
  leaveLiveTournament,
  playLiveMatch,
  resetCareer,
  setTrainingPlan,
  upgradeEquipment,
} from "@/server/careerService";

export async function createCareerAction(formData: FormData): Promise<void> {
  if (await hasCareer()) redirect("/kariyer");
  await createCareer({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    weapon: String(formData.get("weapon") ?? ""),
    profile: String(formData.get("profile") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    city: String(formData.get("city") ?? ""),
  });
  redirect("/kariyer");
}

/**
 * "İlerle / Geç" — sabit çubuktan gün-bazlı zaman sürücüsü (online'da otomatik). Sonraki turnuva
 * gününe kadar ilerler (antrenmanları uygular), turnuva gününde durur (Katıl/Geç).
 */
export async function advanceDayAction(): Promise<void> {
  const result = await advanceDay();
  if (result.live) redirect("/turnuva/canli");
  revalidatePath("/kariyer", "layout"); // başlık (gün) + mevcut sayfa tazelensin
}

/** Bugünkü turnuvaya katılır → canlı turnuva ekranına geçer. */
export async function attendTournamentAction(): Promise<void> {
  const result = await attendTournament();
  if (result.live) redirect("/turnuva/canli");
  revalidatePath("/kariyer", "layout");
}

/** Haftalık antrenman planını kaydeder (4 seans: Pzt/Çrş/Cuma/Pazar). */
export async function setTrainingPlanAction(formData: FormData): Promise<void> {
  const slots = ["slot1", "slot2", "slot3", "slot4"]
    .map((s) => String(formData.get(s) ?? ""))
    .filter((v): v is TrainingType => TRAINING_TYPES.includes(v as TrainingType));
  await setTrainingPlan(slots);
  revalidatePath("/kariyer/antrenman");
}

export async function upgradeEquipmentAction(): Promise<void> {
  await upgradeEquipment();
  revalidatePath("/kariyer/ekipman");
}

/** Canlı turnuvada sıradaki maçı seçilen taktikle oynar (GDD 18.22 — her maçın kendi taktiği). */
export async function playLiveMatchAction(formData: FormData): Promise<void> {
  const tactic = String(formData.get("tactic") ?? "") as Tactic;
  if (!TACTICS.includes(tactic)) throw new Error("Geçersiz taktik");
  await playLiveMatch(tactic);
  revalidatePath("/turnuva/canli");
}

/** Pul bitince elemeye geçer. */
export async function enterBracketAction(): Promise<void> {
  await enterBracket();
  revalidatePath("/turnuva/canli");
}

/** Biten canlı turnuvadan kariyere döner (durum temizlenir). */
export async function leaveLiveTournamentAction(): Promise<void> {
  await leaveLiveTournament();
  redirect("/kariyer");
}

export async function resetCareerAction(): Promise<void> {
  await resetCareer();
  redirect("/");
}
