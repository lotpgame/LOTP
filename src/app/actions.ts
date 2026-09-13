"use server";

/**
 * Server Actions — UI'nin çağırdığı sunucu fonksiyonları (Next 16). Kritik hesap sunucuda;
 * girdi Career Service içinde Zod ile doğrulanır (GDD güvenlik). Her aksiyon POST ile çalışır.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TACTICS, type Tactic } from "@/engine/combat";
import { TOURNAMENT_LABEL_TR, type TournamentLevel } from "@/engine/domain";
import { TRAINING_TYPES, type TrainingType } from "@/engine/training";
import {
  advanceWeek,
  cancelRegistration,
  createCareer,
  enterBracket,
  hasCareer,
  leaveLiveTournament,
  playLiveMatch,
  registerTournament,
  restWeek,
  resetCareer,
  setTrainingPlan,
  upgradeEquipment,
} from "@/server/careerService";

const KNOWN_LEVELS = new Set(Object.keys(TOURNAMENT_LABEL_TR));

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
 * "Haftayı İlerle" — sabit çubuktan tek-oyuncu zaman sürücüsü (CM "Next"; online'da otomatik).
 * Kayıtlı turnuvanın haftası geldiyse turnuvaya götürür; yoksa KAYITLI haftalık planı uygular.
 */
export async function advanceWeekAction(): Promise<void> {
  const result = await advanceWeek();
  if (result.live) redirect("/turnuva/canli"); // canlı turnuva başladı
  revalidatePath("/kariyer", "layout"); // başlık (hafta) + mevcut sayfa tazelensin
}

/** Haftalık antrenman planını kaydeder (Antrenman sayfasından). */
export async function setTrainingPlanAction(formData: FormData): Promise<void> {
  const slots = ["slot1", "slot2", "slot3"]
    .map((s) => String(formData.get(s) ?? ""))
    .filter((v): v is TrainingType => TRAINING_TYPES.includes(v as TrainingType));
  await setTrainingPlan(slots);
  revalidatePath("/kariyer/antrenman");
}

export async function restWeekAction(): Promise<void> {
  await restWeek();
  revalidatePath("/kariyer/antrenman");
}

export async function upgradeEquipmentAction(): Promise<void> {
  await upgradeEquipment();
  revalidatePath("/kariyer/ekipman");
}

/** Turnuvaya "Katıl" — kayıt olur; oynanacağı hafta gelince "Haftayı İlerle" oynatır (GDD 17.20). */
export async function registerAction(formData: FormData): Promise<void> {
  const level = String(formData.get("level") ?? "") as TournamentLevel;
  const weekIndex = Number(formData.get("weekIndex"));
  if (!KNOWN_LEVELS.has(level)) throw new Error("Geçersiz turnuva seviyesi");
  if (!Number.isInteger(weekIndex) || weekIndex < 0) throw new Error("Geçersiz hafta");
  await registerTournament(level, weekIndex);
  revalidatePath("/kariyer/turnuvalar");
}

/** Bekleyen turnuva kaydını iptal eder. */
export async function cancelRegistrationAction(): Promise<void> {
  await cancelRegistration();
  revalidatePath("/kariyer/antrenman");
  revalidatePath("/kariyer/turnuvalar");
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
