/**
 * Dağıtım sürümü — iOS ana-ekran (PWA) eski sürümde donduğunda otomatik yenileme için (VersionWatcher).
 * Her deploy'da değişen bir kimlik döner (Vercel commit sha / deployment id). ÖNBELLEĞE ALINMAZ.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const v = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? "dev";
  return NextResponse.json(
    { v },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
  );
}
