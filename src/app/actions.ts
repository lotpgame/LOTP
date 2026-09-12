"use server";

/**
 * Server Actions — UI'nin çağırdığı sunucu fonksiyonları (Next 16). Kritik hesap sunucuda;
 * girdi Career Service içinde Zod ile doğrulanır (GDD güvenlik). Her aksiyon POST ile çalışır.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TournamentLevel } from "@/engine/domain";
import { TRAINING_TYPES, type TrainingType } from "@/engine/training";
import {
  createCareer,
  hasCareer,
  playWeek,
  restWeek,
  resetCareer,
  runTournament,
} from "@/server/careerService";

// M3'te oyuncunun serbestçe katılabileceği yurt içi seviyeler (davet/ranking şartı yok).
const PLAYABLE_LEVELS: readonly TournamentLevel[] = ["IL", "OPEN", "TURKIYE"];

export async function createCareerAction(formData: FormData): Promise<void> {
  if (await hasCareer()) redirect("/kariyer");
  await createCareer({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    weapon: String(formData.get("weapon") ?? ""),
    profile: String(formData.get("profile") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
  });
  redirect("/kariyer");
}

export async function playWeekAction(formData: FormData): Promise<void> {
  // Haftalık plan: 3 seans (boş/geçersiz olanlar atlanır).
  const slots = ["slot1", "slot2", "slot3"]
    .map((s) => String(formData.get(s) ?? ""))
    .filter((v): v is TrainingType => TRAINING_TYPES.includes(v as TrainingType));
  if (slots.length === 0) throw new Error("En az bir seans seç");
  await playWeek(slots);
  revalidatePath("/kariyer");
}

export async function restWeekAction(): Promise<void> {
  await restWeek();
  revalidatePath("/kariyer");
}

export async function runTournamentAction(formData: FormData): Promise<void> {
  const level = String(formData.get("level") ?? "OPEN") as TournamentLevel;
  if (!PLAYABLE_LEVELS.includes(level)) throw new Error("Geçersiz turnuva seviyesi");
  const result = await runTournament(level);
  redirect(`/turnuva/${result.tournamentId}`);
}

export async function resetCareerAction(): Promise<void> {
  await resetCareer();
  redirect("/");
}
