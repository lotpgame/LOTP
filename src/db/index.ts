/**
 * Database katmanı — YALNIZ saklar, hesaplamaz (GDD 5.36, 22.2).
 *
 * Engine'ler DB'ye doğrudan değil, `src/server` içindeki Data Service üzerinden erişir
 * (GDD 22.64: Engine → Data Service → Database). Bu dosya Prisma client'ı ve üretilen
 * model tiplerini dışa açar.
 */
export { prisma } from "./client";
export type { Country, Player, Season } from "@/generated/prisma/client";
