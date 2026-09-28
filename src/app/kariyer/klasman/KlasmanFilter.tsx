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
import { CONTINENTS, COUNTRIES } from "@/engine/geo";
import { t, type Locale } from "@/i18n";
import type { RankingRowDTO } from "@/server/careerService";
import { RankingTower } from "../parts";

const AGES = ["U10", "U12", "U14", "U17", "U21", "SENIOR"];
type ScopeLevel = "world" | "continent" | "country";

const GENDER_FROM_CODE: Record<string, Gender> = { M: "MALE", F: "FEMALE" };
const WEAPON_FROM_CODE: Record<string, Weapon> = { FL: "FOIL", EPE: "EPEE", KIL: "SABRE" };

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`press flex min-h-11 shrink-0 items-center rounded-md border px-3 text-[14px] ${
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

  const selCls = "mt-2 min-h-11 w-full rounded-md border border-line bg-arena-1 px-3 text-[15px] outline-none focus:border-ink";

  const setScopeLevel = (lv: ScopeLevel) => {
    setLevel(lv);
    load(age, gender, weapon, lv, continent, country);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ANA kapsam: Dünya / Kıta / Ülke */}
      <div className="flex rounded-md border border-line p-0.5" role="group" aria-label={t(locale, "klasman.rankings")}>
        {(["world", "continent", "country"] as ScopeLevel[]).map((lv) => (
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
          className={selCls}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {/* Kategori çipleri: yaş / silah / cinsiyet — yatay kaydırılır */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0">
        {AGES.map((a) => (
          <Chip
            key={a}
            on={age === a}
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
          <span className="lamp lamp-white anim-live h-2 w-2" aria-hidden="true" />
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
