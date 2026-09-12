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
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL tanımlı değil. .env dosyasını oluşturun (bkz. .env.example).",
    );
  }
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
