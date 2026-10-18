import { redirect } from "next/navigation";

// Telefon girişi kaldırıldı — giriş artık ana sayfada (Google ile). Eski link/yer imleri için yönlendir.
export const dynamic = "force-dynamic";

export default async function GirisPage() {
  redirect("/");
}
