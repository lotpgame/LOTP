/**
 * Data Service — Engine ↔ Database sınırı (GDD 22.64: Engine → Data Service → Database).
 *
 * NEDEN: Saf engine'ler (src/engine/*) DB bilmez. Orkestrasyon burada olur: veriyi Prisma
 * ile yükle → engine fonksiyonunu düz veriyle çağır → sonucu kalıcılaştır. Engine'ler
 * Database'e doğrudan rastgele sorgu göndermez (GDD 22.63–22.64).
 *
 * M0: yalnızca iskelet + bağlantı doğrulama. Oyuncu oluşturma, antrenman, turnuva gibi
 * gerçek servis fonksiyonları M1'de eklenecek — bkz. docs/ROADMAP.md §B.
 */
import { prisma } from "@/db";
import type { Country, Player } from "@/db";

/** DB bağlantısını doğrular; sorun varsa hata fırlatır. */
export async function ping(): Promise<boolean> {
  await prisma.$queryRaw`SELECT 1`;
  return true;
}

/** Tüm ülkeleri getirir (koda göre sıralı). */
export function listCountries(): Promise<Country[]> {
  return prisma.country.findMany({ orderBy: { code: "asc" } });
}

/** Bir oyuncuyu numerik id ile getirir; yoksa null. */
export function getPlayerById(id: number): Promise<Player | null> {
  return prisma.player.findUnique({ where: { id } });
}
