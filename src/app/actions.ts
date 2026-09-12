"use server";

/**
 * Server Actions — UI'nin çağırdığı sunucu fonksiyonları (Next 16). Kritik hesap sunucuda;
 * girdi Career Service içinde Zod ile doğrulanır (GDD güvenlik). Her aksiyon POST ile çalışır.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TRAINING_TYPES, type TrainingType } from "@/engine/training";
import {
  createCareer,
  hasCareer,
  resetCareer,
  runTournament,
  trainOneDay,
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
  });
  redirect("/kariyer");
}

export async function trainAction(formData: FormData): Promise<void> {
  const type = String(formData.get("type") ?? "") as TrainingType;
  if (!TRAINING_TYPES.includes(type)) throw new Error("Geçersiz antrenman türü");
  await trainOneDay(type);
  revalidatePath("/kariyer");
}

export async function runTournamentAction(): Promise<void> {
  const result = await runTournament();
  redirect(`/turnuva/${result.tournamentId}`);
}

export async function resetCareerAction(): Promise<void> {
  await resetCareer();
  redirect("/");
}
