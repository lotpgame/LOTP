/**
 * Başsız (headless) çalıştırıcı — `npm run sim`.
 *
 * NEDEN: Saf engine mantığı web olmadan da çalışabilmeli (GDD 4.33: 100 oyuncu × 20 yıl
 * dengeleme simülasyonları). M0'da bu bir iskelet: tohumlanabilir RNG'nin çalıştığını ve
 * DB bağlantısının kurulduğunu (Prisma 7 + better-sqlite3) doğrular. Gerçek dengeleme
 * simülasyonları M8'de gelecek — bkz. docs/ROADMAP.md §B.
 */
import "dotenv/config";
import { createRng } from "@/engine/probability";
import { listCountries, ping } from "@/server/dataService";

async function main() {
  console.log("=== Project Engarde — sim (M0 smoke) ===");

  // 1) RNG deterministik mi?
  const seed = "engarde-demo";
  const roll = (r = createRng(seed)) => Array.from({ length: 5 }, () => r.int(1, 6));
  const a = roll();
  const b = roll();
  console.log(`RNG seed="${seed}" ilk 5 zar: [${a.join(", ")}]`);
  console.log(`Tekrar (aynı seed):        [${b.join(", ")}]`);
  console.log(`Tekrarlanabilir mi: ${JSON.stringify(a) === JSON.stringify(b) ? "EVET ✅" : "HAYIR ❌"}`);

  // 2) DB bağlantısı kuruluyor mu?
  try {
    await ping();
    const countries = await listCountries();
    console.log(`DB bağlantısı: OK ✅ (kayıtlı ülke sayısı: ${countries.length})`);
  } catch (err) {
    console.log(`DB bağlantısı: HATA ❌ — ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

main();
