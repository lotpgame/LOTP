"use client";

import { useEffect, useRef, useState } from "react";
import { Flag } from "./kariyer/Flag";

/**
 * Sporcu oluştururken ülke + şehir seçimi. Ülke değişince şehir listesi o ülkeninkiyle güncellenir
 * (telefon kalktığı için oyuncunun bölgesi buradan belirlenir; IP otomatiği V2). İsimler sunucuda
 * çevrilip (localized) buraya hazır gelir; bu bileşen yalnız etkileşimi yönetir.
 *
 * Ülke seçimi NATIVE <select> değil, ÖZEL açılır listedir: native <option> içine görsel konamaz, bu yüzden
 * eskiden emoji bayrak kullanılıyordu — ama Windows masaüstü bayrak emojisini "GB" harfleri olarak gösteriyordu
 * (kullanıcı 23.11). Artık her platformda gerçek SVG bayrak (flagcdn) görünür. Form gönderimi için gizli
 * input (name="country") tutulur. Şehir seçimi native kalır (şehirde bayrak yok, native en iyi).
 */
export interface CountryOption {
  code: string;
  name: string; // çevrilmiş ülke adı
  flag?: string; // (artık kullanılmıyor — SVG bayrak koddan türetilir; geriye uyumluluk için opsiyonel)
  cities: readonly string[]; // o ülkenin (alfabetik) şehirleri
}

export function CountryCitySelect({
  countries,
  countryLabel,
  cityLabel,
  defaultCountry,
  inputCls,
}: {
  countries: readonly CountryOption[];
  countryLabel: string;
  cityLabel: string;
  defaultCountry: string;
  inputCls: string;
}) {
  const [country, setCountry] = useState(defaultCountry);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const cities = countries.find((c) => c.code === country)?.cities ?? [];
  const selected = countries.find((c) => c.code === country);

  // Dışarı tık / Escape → kapat.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-semibold">{countryLabel}</span>
        {/* Form değeri: gizli input (özel liste native select değil). */}
        <input type="hidden" name="country" value={country} />
        <div ref={boxRef} className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={`${inputCls} flex items-center gap-2 text-left`}
          >
            {selected && <Flag code={selected.code} className="h-3.5 w-[22px] shrink-0 rounded-[2px] ring-1 ring-black/10 dark:ring-white/15" />}
            <span className="min-w-0 flex-1 truncate">{selected?.name ?? ""}</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} fill="currentColor">
              <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open && (
            <ul
              role="listbox"
              className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-arena-1 py-1 shadow-xl"
            >
              {countries.map((c) => (
                <li key={c.code} role="option" aria-selected={c.code === country}>
                  <button
                    type="button"
                    onClick={() => {
                      setCountry(c.code);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[15px] hover:bg-arena-2 ${c.code === country ? "font-semibold" : ""}`}
                  >
                    <Flag code={c.code} className="h-3.5 w-[22px] shrink-0 rounded-[2px] ring-1 ring-black/10 dark:ring-white/15" />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-semibold">{cityLabel}</span>
        {/* key={country}: ülke değişince şehir select'i yeniden kurulur → varsayılan ilk şehre döner */}
        <select name="city" required key={country} defaultValue={cities[0]} className={inputCls}>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
