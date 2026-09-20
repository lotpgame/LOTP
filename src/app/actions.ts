"use server";

/**
 * Server Actions — UI'nin çağırdığı sunucu fonksiyonları (Next 16). Kritik hesap sunucuda;
 * girdi Career Service içinde Zod ile doğrulanır (GDD güvenlik). Her aksiyon POST ile çalışır.
 */
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n";
import { TACTICS, type Tactic } from "@/engine/combat";
import { type TournamentLevel } from "@/engine/domain";
import { type TrainingType } from "@/engine/training";
import {
  advanceDay,
  advanceLiveStage,
  attendTournament,
  clearReport,
  clearAwayReport,
  createCareer,
  getCategoryRanking,
  hasCareer,
  leaveLiveTournament,
  playLiveMatch,
  registerTournament,
  resetCareer,
  setTrainingPlan,
  signInWithPhone,
  signOut,
  unregisterTournament,
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
 * "Dünyaya yetiş" (M10): dünya saati gerçek zamanla akar; bu, kariyeri şimdiki dünya gününe kadar
 * otomatik ilerletir (antrenmanları uygular), uygun turnuva gününde durur (Katıl/Geç). Sayfa açılınca
 * otomatik tetiklenir — "Haftayı İlerle" butonu kalktı.
 */
export async function advanceDayAction(): Promise<void> {
  const result = await advanceDay(false);
  if (result.live) redirect("/turnuva/canli");
  revalidatePath("/kariyer", "layout"); // başlık (gün) + mevcut sayfa tazelensin
}

/** "Geç" — bugünkü turnuvaya katılmayıp o gün planındaki antrenmanı yapar, sonraki güne geçer. */
export async function skipDayAction(): Promise<void> {
  const result = await advanceDay(true);
  if (result.live) redirect("/turnuva/canli");
  revalidatePath("/kariyer", "layout");
}

/** Bugünkü turnuvaya katılır → canlı turnuva ekranına geçer. */
export async function attendTournamentAction(): Promise<void> {
  const result = await attendTournament();
  if (result.live) redirect("/turnuva/canli");
  revalidatePath("/kariyer", "layout");
}

/** 7 günlük antrenman planını kaydeder (Pzt..Paz; her gün antrenman türü veya Dinlenme). */
export async function setTrainingPlanAction(formData: FormData): Promise<void> {
  const slots = ["slot0", "slot1", "slot2", "slot3", "slot4", "slot5", "slot6"].map(
    (s) => String(formData.get(s) ?? "REST") as TrainingType,
  );
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

/** Turnuva aşamalarını tek tek ilerletir (Devam / Elemeye Geç / Maça Geç ve 10 sn geri sayım). */
export async function advanceLiveStageAction(): Promise<void> {
  await advanceLiveStage();
  revalidatePath("/turnuva/canli");
}

/** Biten canlı turnuvadan kariyere döner (durum temizlenir). */
export async function leaveLiveTournamentAction(): Promise<void> {
  await leaveLiveTournament();
  redirect("/kariyer");
}

/** Klasman filtresi: seçilen kategorinin sıralamasını döndürür (çok oyunculuda dolu, V1'de çoğu boş). */
export async function getCategoryRankingAction(
  categoryId: string,
  scope?: { continent?: string; country?: string },
) {
  if (!/^[A-Z0-9]+-[MF]-(FL|EPE|KIL)$/.test(categoryId)) throw new Error("Geçersiz kategori");
  if (scope?.country && !/^[A-Z]{2}$/.test(scope.country)) throw new Error("Geçersiz ülke");
  if (scope?.continent && !/^(EU|AS|AM|AF)$/.test(scope.continent)) throw new Error("Geçersiz kıta");
  return getCategoryRanking(categoryId, scope ?? {});
}

export async function resetCareerAction(): Promise<void> {
  await resetCareer();
  redirect("/");
}

/** Telefonla giriş (M9.2). Sonucu döndürür → istemci hatayı gösterir / başarıda yönlendirir. */
export async function signInWithPhoneAction(
  phone: string,
): Promise<{ ok: boolean; reason?: "format" | "unsupported"; linked?: boolean }> {
  const res = await signInWithPhone(phone);
  if (res.ok) revalidatePath("/", "layout");
  return res;
}

/** Oturumu kapatır. */
export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/");
}

/** M10.2: Yaklaşan turnuvaya önceden taktikle kaydolur. */
export async function registerTournamentAction(formData: FormData): Promise<void> {
  const worldDay = Number(formData.get("worldDay"));
  const level = String(formData.get("level") ?? "") as TournamentLevel;
  const tactic = String(formData.get("tactic") ?? "BALANCED") as Tactic;
  if (!TACTICS.includes(tactic)) throw new Error("Geçersiz taktik");
  await registerTournament(worldDay, level, tactic);
  revalidatePath("/kariyer/turnuvalar");
}

/** M10.2: Turnuva kaydını iptal eder. */
export async function unregisterTournamentAction(formData: FormData): Promise<void> {
  const worldDay = Number(formData.get("worldDay"));
  const level = String(formData.get("level") ?? "") as TournamentLevel;
  await unregisterTournament(worldDay, level);
  revalidatePath("/kariyer/turnuvalar");
}

/** Antrenman haber kartını kapatır. */
export async function clearReportAction(): Promise<void> {
  await clearReport();
  revalidatePath("/kariyer", "layout");
}

/** "Yokken neler oldu" kartını kapatır (M11.4). */
export async function clearAwayReportAction(): Promise<void> {
  await clearAwayReport();
  revalidatePath("/kariyer", "layout");
}

/** Arayüz dilini değiştirir (cookie'ye yazar). */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const raw = String(formData.get("locale") ?? "tr") as Locale;
  const locale: Locale = LOCALES.includes(raw) ? raw : "tr";
  const c = await cookies();
  c.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
