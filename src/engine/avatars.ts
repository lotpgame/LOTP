/**
 * Avatar atama — oyuncuya (insan + AI) cinsiyetine göre MEVCUT setlerden deterministik yüz seçer.
 * Seçim ekranı YOK (kullanıcı kararı 28.10): avatar otomatik atanır, Player.avatar'a yazılır.
 * Havuz = slicer'ın ürettiği manifest (src/data/avatarManifest.json); yeni set eklenince kod
 * DEĞİŞMEDEN büyür (manifest import edilir → bundle'lanır → Vercel'de de güvenli).
 */
import { createRng } from "@/engine/probability";
import manifest from "@/data/avatarManifest.json";

/**
 * Cinsiyete uygun havuzdan deterministik bir avatar seti (seed ile → aynı oyuncu hep aynı yüz).
 * Havuz boşsa null döner (çağıran harf rozetine düşer). FEMALE → kız (g), diğer → erkek (b).
 */
export function pickAvatar(gender: string, seed: string): string | null {
  const pool = gender === "FEMALE" ? manifest.g : manifest.b;
  if (pool.length === 0) return null;
  return pool[createRng(`avatar:${seed}`).int(0, pool.length - 1)];
}
