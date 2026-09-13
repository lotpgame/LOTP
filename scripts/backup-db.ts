/**
 * Basit veritabanı yedeği — `npm run db:backup` (GDD 22.58).
 * Geliştirme SQLite dosyasını zaman damgalı bir kopya olarak `prisma/backups/` altına alır.
 * (Yedekler .gitignore'daki *.db ile izlenmez.)
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = join("prisma", "dev.db");
const BACKUP_DIR = join("prisma", "backups");

if (!existsSync(DB_PATH)) {
  console.error(`Veritabanı bulunamadı: ${DB_PATH}. Önce 'npm run db:migrate' çalıştır.`);
  process.exit(1);
}

mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = join(BACKUP_DIR, `dev-${stamp}.db`);
copyFileSync(DB_PATH, target);
console.log(`Yedek alındı: ${target}`);
