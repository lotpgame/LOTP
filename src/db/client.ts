/**
 * Prisma client (tek örnek / singleton).
 *
 * NEDEN singleton: Next.js geliştirme modunda sıcak yeniden yükleme (HMR) her seferinde
 * yeni bir client yaratıp bağlantıları tüketebilir; globalThis üzerinde saklayarak önleriz.
 *
 * Prisma 7: SQLite için driver adapter zorunlu (@prisma/adapter-better-sqlite3).
 * DATABASE_URL: Next.js `.env`'i otomatik yükler; başsız script'ler `import "dotenv/config"`
 * ile yükler (bkz. scripts/*).
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL tanımlı değil. .env dosyasını oluşturun (bkz. .env.example).",
    );
  }
  // URL şemasına göre sürücü: postgres:// → Neon/Postgres (pg); file: → yerel SQLite (better-sqlite3).
  const isPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");
  const adapter = isPostgres ? new PrismaPg({ connectionString: url }) : new PrismaBetterSqlite3({ url });
  // İşlem zaman aşımı: kariyer oluşturma/turnuva sonu çok sorgulu; Postgres'te (özellikle uzak/yerel
  // geliştirmede ağ gecikmesiyle) 5 sn'lik varsayılan yetmez. Aynı-bölge (Vercel+Neon) prod'da zaten hızlı.
  return new PrismaClient({ adapter, transactionOptions: { maxWait: 10_000, timeout: 30_000 } });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
