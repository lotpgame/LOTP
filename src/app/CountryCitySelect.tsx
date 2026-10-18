"use client";

import { useState } from "react";

/**
 * Sporcu oluştururken ülke + şehir seçimi. Ülke değişince şehir listesi o ülkeninkiyle güncellenir
 * (telefon kalktığı için oyuncunun bölgesi buradan belirlenir; IP otomatiği V2). İsimler sunucuda
 * çevrilip (localized) buraya hazır gelir; bu bileşen yalnız etkileşimi yönetir.
 */
export interface CountryOption {
  code: string;
  name: string; // çevrilmiş ülke adı
  flag: string; // bayrak emojisi
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
  const cities = countries.find((c) => c.code === country)?.cities ?? [];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-semibold">{countryLabel}</span>
        <select
          name="country"
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={inputCls}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
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
