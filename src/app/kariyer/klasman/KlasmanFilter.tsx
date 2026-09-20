"use client";

/**
 * Klasman filtresi. ANA kapsam (M-UI): Dünya / Kıta / Ülke — 3 mod. Sonra kategori: yaş/cinsiyet/silah.
 * Kapsam daraldıkça (kıta/ülke) sıralama kapsam-içi 1..N gösterilir.
 */
import { useState, useTransition } from "react";
import { getCategoryRankingAction } from "@/app/actions";
import {
  GENDERS,
  WEAPONS,
  makeCategoryId,
  type AgeCategory,
  type Gender,
  type Weapon,
} from "@/engine/domain";
import { CONTINENTS, COUNTRIES } from "@/engine/geo";
import { t, type Locale } from "@/i18n";
import type { RankingRowDTO } from "@/server/careerService";

const AGES = ["U10", "U12", "U14", "U17", "U21", "SENIOR"];
type ScopeLevel = "world" | "continent" | "country";

const GENDER_FROM_CODE: Record<string, Gender> = { M: "MALE", F: "FEMALE" };
const WEAPON_FROM_CODE: Record<string, Weapon> = { FL: "FOIL", EPE: "EPEE", KIL: "SABRE" };

export function KlasmanFilter({
  initialCategoryId,
  initialRows,
  locale,
}: {
  initialCategoryId: string;
  initialRows: RankingRowDTO[];
  locale: Locale;
}) {
  const [age0, gCode, wCode] = initialCategoryId.split("-");
  const [age, setAge] = useState(age0);
  const [gender, setGender] = useState<Gender>(GENDER_FROM_CODE[gCode] ?? "MALE");
  const [weapon, setWeapon] = useState<Weapon>(WEAPON_FROM_CODE[wCode] ?? "FOIL");
  const [level, setLevel] = useState<ScopeLevel>("world");
  const [continent, setContinent] = useState<string>(CONTINENTS[0].code);
  const [country, setCountry] = useState<string>(COUNTRIES[0].code);
  const [rows, setRows] = useState<RankingRowDTO[]>(initialRows);
  const [pending, startTransition] = useTransition();

  const scopeOf = (lv: ScopeLevel, cont: string, co: string) =>
    lv === "continent" ? { continent: cont } : lv === "country" ? { country: co } : {};

  const load = (a: string, g: Gender, w: Weapon, lv: ScopeLevel, cont: string, co: string) => {
    startTransition(async () => {
      setRows(await getCategoryRankingAction(makeCategoryId(a as AgeCategory, g, w), scopeOf(lv, cont, co)));
    });
  };

  const selCls =
    "rounded-lg border border-black/15 bg-transparent px-2 py-2 text-sm outline-none focus:border-emerald-500 dark:border-white/20";
  const tabCls = (on: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      on ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-black/5 opacity-70 hover:opacity-100 dark:bg-white/10"
    }`;

  const setScopeLevel = (lv: ScopeLevel) => {
    setLevel(lv);
    load(age, gender, weapon, lv, continent, country);
  };

  return (
    <div>
      {/* ANA kapsam: Dünya / Kıta / Ülke */}
      <div className="flex gap-2">
        <button onClick={() => setScopeLevel("world")} className={tabCls(level === "world")}>
          🌍 {t(locale, "klasman.world")}
        </button>
        <button onClick={() => setScopeLevel("continent")} className={tabCls(level === "continent")}>
          {t(locale, "klasman.continent")}
        </button>
        <button onClick={() => setScopeLevel("country")} className={tabCls(level === "country")}>
          {t(locale, "klasman.country")}
        </button>
      </div>

      {/* Kıta/Ülke seçince alt seçim */}
      {level === "continent" && (
        <select
          value={continent}
          onChange={(e) => {
            setContinent(e.target.value);
            load(age, gender, weapon, "continent", e.target.value, country);
          }}
          className={`${selCls} mt-2 w-full`}
        >
          {CONTINENTS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
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
          className={`${selCls} mt-2 w-full`}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {/* Kategori: yaş / cinsiyet / silah */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <select
          value={age}
          onChange={(e) => {
            setAge(e.target.value);
            load(e.target.value, gender, weapon, level, continent, country);
          }}
          className={selCls}
        >
          {AGES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={gender}
          onChange={(e) => {
            const g = e.target.value as Gender;
            setGender(g);
            load(age, g, weapon, level, continent, country);
          }}
          className={selCls}
        >
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {t(locale, `gender.${g}`)}
            </option>
          ))}
        </select>
        <select
          value={weapon}
          onChange={(e) => {
            const w = e.target.value as Weapon;
            setWeapon(w);
            load(age, gender, w, level, continent, country);
          }}
          className={selCls}
        >
          {WEAPONS.map((w) => (
            <option key={w} value={w}>
              {t(locale, `weapon.${w}`)}
            </option>
          ))}
        </select>
      </div>

      {pending ? (
        <p className="mt-3 text-sm opacity-60">{t(locale, "klasman.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-black/15 p-3 text-sm opacity-60 dark:border-white/20">
          {t(locale, "klasman.emptyCat")}
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
          {rows.map((r) => (
            <li
              key={r.playerId}
              className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${
                r.isHuman ? "bg-emerald-500/10 font-medium" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="inline-block w-6 tabular-nums opacity-60">{r.position}.</span>
                {r.name}
                {r.isHuman ? ` ${t(locale, "common.you")}` : ""}
                {r.clubName ? <span className="ml-1 text-xs opacity-50">· {r.clubName}</span> : null}
              </span>
              <span className="shrink-0 tabular-nums opacity-70">{r.points.toFixed(1)} p</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
