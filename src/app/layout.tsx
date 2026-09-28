import type { Metadata } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import "./globals.css";
import { ThemeApplier } from "./ThemeApplier";
import { THEME_BG_KEY, THEME_FG_KEY } from "./themeKeys";

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
  title: "Legends of the Piste",
  description: "Eskrim kariyer ve yönetim simülasyonu",
};

// Kayıtlı kişisel tema renklerini ilk boyamadan ÖNCE uygular (yanıp sönme olmasın). Yalnız #rgb/#rrggbb
// kabul edilir; ThemeApplier aynı işi mount sonrası yedek olarak tekrarlar.
const THEME_BOOT = `try{var h=/^#[0-9a-fA-F]{3,8}$/,d=document.documentElement.style,b=localStorage.getItem(${JSON.stringify(THEME_BG_KEY)}),f=localStorage.getItem(${JSON.stringify(THEME_FG_KEY)});if(b&&h.test(b))d.setProperty("--background",b);if(f&&h.test(f))d.setProperty("--foreground",f)}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT}
        </Script>
        <ThemeApplier />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line py-3 text-center text-[13px] text-steel">
          {t(locale, "footer.tagline")}
        </footer>
      </body>
    </html>
  );
}
