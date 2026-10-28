import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import "./globals.css";
import { InstagramWarning } from "./InstagramWarning";
import { RotateGate } from "./RotateGate";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";
import { ThemeApplier } from "./ThemeApplier";
import { THEME_BG_KEY, THEME_FG_KEY, THEME_ME_KEY } from "./themeKeys";
import { isInstagramBrowser } from "./ui/inAppBrowser";

// latin-ext: Türkçe karakterler (ş ğ ı İ) aynı fonttan gelsin.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

// Başlık/kicker/marka yazısı için tek ek font (dar, sporcu tabelası hissi).
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["600", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  // Sabit — proje tek alan adında (özel domain/staging yok). og:image gibi göreli metadata URL'lerini
  // çözmek için gerekli, yoksa build "http://localhost:3000"e düşer (canlıda kırık önizleme).
  metadataBase: new URL("https://lotp-one.vercel.app"),
  title: "Legends of the Piste",
  description: "Eskrim kariyer ve yönetim simülasyonu",
  applicationName: "Legends of the Piste",
  // PWA: iOS "Ana ekrana ekle" → tam ekran app, kısa ad, saydam durum çubuğu. (Android manifest'ten gelir.)
  appleWebApp: { capable: true, title: "LOTP", statusBarStyle: "black-translucent" },
  icons: { icon: "/favicon.ico", apple: "/icons/apple-180.png" },
};

// PWA standalone: tema rengi + çentikli ekranlarda tam ekran (safe-area inset'ler çalışsın).
export const viewport: Viewport = {
  themeColor: "#0b0e12",
  viewportFit: "cover",
};

// Kayıtlı kişisel tema renklerini ilk boyamadan ÖNCE uygular (yanıp sönme olmasın). Yalnız #rgb/#rrggbb
// kabul edilir; ThemeApplier aynı işi mount sonrası yedek olarak tekrarlar.
const THEME_BOOT = `try{var h=/^#[0-9a-fA-F]{3,8}$/,d=document.documentElement.style,b=localStorage.getItem(${JSON.stringify(THEME_BG_KEY)}),f=localStorage.getItem(${JSON.stringify(THEME_FG_KEY)}),m=localStorage.getItem(${JSON.stringify(THEME_ME_KEY)});if(b&&h.test(b))d.setProperty("--background",b);if(f&&h.test(f))d.setProperty("--foreground",f);if(m&&h.test(m))d.setProperty("--me",m)}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const isInstagram = isInstagramBrowser((await headers()).get("user-agent"));
  return (
    <html
      lang={locale}
      // Oyun YALNIZ yatay oynanır (app kararı): görünüm her zaman landscape, seçenek yok.
      // Cihaz dik tutulunca RotateGate "telefonu yan çevir" der. suppressHydrationWarning: theme-boot
      // yine <html> style'ına kişisel tema renklerini yazar (sığ kapsam: yalnız <html>).
      data-view="landscape"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT}
        </Script>
        <ThemeApplier />
        <ServiceWorkerRegister />
        <InstagramWarning show={isInstagram} locale={locale} />
        <RotateGate locale={locale} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line py-3 text-center text-[13px] text-steel">
          {t(locale, "footer.tagline")}
        </footer>
      </body>
    </html>
  );
}
