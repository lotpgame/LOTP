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
  hasCareer,
  registerTournament,
  restWeek,
  resetCareer,
  setTactic,
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
 * "Haftayı İlerle" — tek-oyuncu zaman sürücüsü (CM "Next" mantığı, GDD 6 döngüsü).
 * Kayıtlı turnuvanın haftası geldiyse turnuvaya götürür; yoksa haftalık antrenman planını uygular.
 */
export async function advanceWeekAction(formData: FormData): Promise<void> {
  const slots = ["slot1", "slot2", "slot3"]
    .map((s) => String(formData.get(s) ?? ""))
    .filter((v): v is TrainingType => TRAINING_TYPES.includes(v as TrainingType));
  const result = await advanceWeek(slots);
  if (result.tournamentId != null) redirect(`/turnuva/${result.tournamentId}`);
  revalidatePath("/kariyer");
}

export async function restWeekAction(): Promise<void> {
  await restWeek();
  revalidatePath("/kariyer");
}

export async function upgradeEquipmentAction(): Promise<void> {
  await upgradeEquipment();
  revalidatePath("/kariyer");
}

/** Turnuvaya "Katıl" — kayıt olur; oynanacağı hafta gelince "Haftayı İlerle" oynatır (GDD 17.20). */
export async function registerAction(formData: FormData): Promise<void> {
  const level = String(formData.get("level") ?? "") as TournamentLevel;
  const weekIndex = Number(formData.get("weekIndex"));
  if (!KNOWN_LEVELS.has(level)) throw new Error("Geçersiz turnuva seviyesi");
  if (!Number.isInteger(weekIndex) || weekIndex < 0) throw new Error("Geçersiz hafta");
  await registerTournament(level, weekIndex);
  revalidatePath("/kariyer");
}

/** Bekleyen turnuva kaydını iptal eder. */
export async function cancelRegistrationAction(): Promise<void> {
  await cancelRegistration();
  revalidatePath("/kariyer");
}

/** Maç öncesi taktik tercihini kaydeder (GDD 18.22). */
export async function setTacticAction(formData: FormData): Promise<void> {
  const tactic = String(formData.get("tactic") ?? "") as Tactic;
  if (!TACTICS.includes(tactic)) throw new Error("Geçersiz taktik");
  await setTactic(tactic);
  revalidatePath("/kariyer");
}

export async function resetCareerAction(): Promise<void> {
  await resetCareer();
  redirect("/");
}
