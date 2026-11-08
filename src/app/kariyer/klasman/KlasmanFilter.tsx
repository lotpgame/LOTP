"use client";

/**
 * Klasman filtresi. ANA kapsam: Dünya / Kıta / Ülke (segment). Sonra kategori çipleri: yaş / silah / cinsiyet
 * (federasyon sırası). Kapsam daraldıkça (kıta/ülke) sıralama kapsam-içi 1..N gösterilir.
 */
import { useState, useTransition, type ReactNode } from "react";
import { getCategoryRankingAction } from "@/app/actions";
import {
  GENDERS,
  WEAPONS,
  makeCategoryId,
  type AgeCategory,
  type Gender,
  type Weapon,
} from "@/engine/domain";
import { CONTINENTS, COUNTRIES, citiesForCountry, continentOfCountry } from "@/engine/geo";
import { t, type Locale } from "@/i18n";
import type { RankingRowDTO } from "@/server/careerService";
import { RankingTower } from "../parts";

const AGES = ["U10", "U12", "U14", "U17", "U21", "SENIOR"];
// Şehir = İl klasmanı (yerel); Ülke = ulusal (Türkiye şamp.); Kıta/Dünya = uluslararası. (Kullanıcı 27.10.)
type ScopeLevel = "city" | "country" | "continent" | "world";

const GENDER_FROM_CODE: Record<string, Gender> = { M: "MALE", F: "FEMALE" };
const WEAPON_FROM_CODE: Record<string, Weapon> = { FL: "FOIL", EPE: "EPEE", KIL: "SABRE" };

function Chip({
  on,
  onClick,
  children,
  className = "",
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`press flex min-h-11 shrink-0 items-center justify-center rounded-md border px-3 text-[14px] ${className} ${
        on ? "border-ink bg-ink font-semibold text-arena-0" : "border-line bg-arena-1 text-steel"
      }`}
    >
      {children}
    </button>
  );
}

export function KlasmanFilter({
  initialCategoryId,
  initialRows,
  countryCode,
  city,
  locale,
}: {
  initialCategoryId: string;
  initialRows: RankingRowDTO[];
  countryCode: string;
  city: string; // oyuncunun kendi şehri (varsayılan "Şehrim" kapsamı)
  locale: Locale;
}) {
  const [age0, gCode, wCode] = initialCategoryId.split("-");
  const [age, setAge] = useState(age0);
  const [gender, setGender] = useState<Gender>(GENDER_FROM_CODE[gCode] ?? "MALE");
  const [weapon, setWeapon] = useState<Weapon>(WEAPON_FROM_CODE[wCode] ?? "FOIL");
  // Varsayılan: ŞEHİR klasmanı (engagement — yerel/sık döngü). initialRows = oyuncunun şehir klasmanı.
  const [level, setLevel] = useState<ScopeLevel>("city");
  const [continent, setContinent] = useState<string>(continentOfCountry(countryCode) ?? CONTINENTS[0].code);
  const [country, setCountry] = useState<string>(countryCode);
  const [selectedCity, setSelectedCity] = useState<string>(city);
  const [rows, setRows] = useState<RankingRowDTO[]>(initialRows);
  const [pending, startTransition] = useTransition();

  const scopeOf = (lv: ScopeLevel, cont: string, co: string, ci: string) =>
    lv === "city"
      ? { country: co, city: ci }
      : lv === "continent"
        ? { continent: cont }
        : lv === "country"
          ? { country: co }
          : {};

  // ci varsayılanı = selectedCity (yalnız şehir seçici değişince açıkça geçilir; diğer değişimler şehri etkilemez).
  const load = (a: string, g: Gender, w: Weapon, lv: ScopeLevel, cont: string, co: string, ci: string = selectedCity) => {
    startTransition(async () => {
      setRows(await getCategoryRankingAction(makeCategoryId(a as AgeCategory, g, w), scopeOf(lv, cont, co, ci)));
    });
  };

  const selCls = "mt-2 min-h-11 w-full rounded-md border border-line bg-arena-1 px-3 text-[15px] outline-none focus:border-ink";
  // Dropdown'lar alfabetik (Türkçe sıralama — kullanıcı 08.11). Ülkeler görünen ada göre; şehirler ada göre.
  const sortedCountries = [...COUNTRIES].sort((a, b) =>
    t(locale, `country.${a.code}`).localeCompare(t(locale, `country.${b.code}`), locale),
  );
  // Şehir sekmesindeki seçili ülkenin şehirleri (herhangi ülke + şehir görülebilir — kullanıcı 27.10).
  const cityOptions = [...citiesForCountry(country)].sort((a, b) => a.localeCompare(b, locale));

  const setScopeLevel = (lv: ScopeLevel) => {
    setLevel(lv);
    load(age, gender, weapon, lv, continent, country);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ANA kapsam: Dünya / Kıta / Ülke */}
      <div className="flex rounded-md border border-line p-0.5" role="group" aria-label={t(locale, "klasman.rankings")}>
        {(["city", "country", "continent", "world"] as ScopeLevel[]).map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => setScopeLevel(lv)}
            aria-pressed={level === lv}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-[5px] text-[14px] ${
              level === lv ? "bg-ink font-semibold text-arena-0" : "text-steel"
            }`}
          >
            {t(locale, `klasman.${lv}`)}
          </button>
        ))}
      </div>

      {/* Şehir: DÜNYADAKİ herhangi ülke + şehir klasmanı görülebilir (arkadaşını gör). Varsayılan = kendi ülken/şehrin. */}
      {level === "city" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <select
            value={country}
            onChange={(e) => {
              const co = e.target.value;
              const first = citiesForCountry(co)[0] ?? "";
              setCountry(co);
              setSelectedCity(first);
              load(age, gender, weapon, "city", continent, co, first);
            }}
            className={`${selCls} sm:flex-1`}
            aria-label={t(locale, "klasman.country")}
          >
            {sortedCountries.map((co) => (
              <option key={co.code} value={co.code}>
                {t(locale, `country.${co.code}`)}
              </option>
            ))}
          </select>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              load(age, gender, weapon, "city", continent, country, e.target.value);
            }}
            className={`${selCls} sm:flex-1`}
            aria-label={t(locale, "klasman.city")}
          >
            {cityOptions.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kıta/Ülke seçince alt seçim */}
      {level === "continent" && (
        <select
          value={continent}
          onChange={(e) => {
            setContinent(e.target.value);
            load(age, gender, weapon, "continent", e.target.value, country);
          }}
          className={selCls}
        >
          {CONTINENTS.map((c) => (
            <option key={c.code} value={c.code}>
              {t(locale, `continent.${c.code}`)}
            </option>
          ))}
        </select>
      )}
      {level === "country" && (
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            load(age, gender, weapon, "country", continent, e.target.value);
          }}
          className={selCls}
        >
          {sortedCountries.map((c) => (
            <option key={c.code} value={c.code}>
              {t(locale, `country.${c.code}`)}
            </option>
          ))}
        </select>
      )}

      {/* Yaş çipleri: sabit 5'li grid → U10-U12-U14-U17-U21 üst satıra tam sığar; Büyükler alt satırda tam genişlik.
          Mobilde yatay kaydırma yok. */}
      <div className="grid grid-cols-5 gap-1.5">
        {AGES.map((a) => (
          <Chip
            key={a}
            on={age === a}
            className={a === "SENIOR" ? "col-span-5" : ""}
            onClick={() => {
              setAge(a);
              load(a, gender, weapon, level, continent, country);
            }}
          >
            {t(locale, `ageLabel.${a}`)}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {WEAPONS.map((w) => (
          <Chip
            key={w}
            on={weapon === w}
            onClick={() => {
              setWeapon(w);
              load(age, gender, w, level, continent, country);
            }}
          >
            {t(locale, `weapon.${w}`)}
          </Chip>
        ))}
        <span className="w-2" aria-hidden="true" />
        {GENDERS.map((g) => (
          <Chip
            key={g}
            on={gender === g}
            onClick={() => {
              setGender(g);
              load(age, g, weapon, level, continent, country);
            }}
          >
            {t(locale, `gender.${g}`)}
          </Chip>
        ))}
      </div>

      {pending ? (
        <p className="flex items-center gap-2 text-[14px] text-steel">
          <span className="lamp bg-ink anim-live h-2 w-2" aria-hidden="true" />
          {t(locale, "klasman.loading")}
        </p>
      ) : rows.length === 0 ? (
        <p className="panel p-3 text-[14px] text-steel">{t(locale, "klasman.emptyCat")}</p>
      ) : (
        <RankingTower rows={rows} locale={locale} />
      )}
    </div>
  );
}
