"use client";

/**
 * Milli takım filtresi: yaş/silah/cinsiyet çipleriyle kategori seç → o kategorinin milli takımı (ilk 4 + overall).
 * Klasman filtresinin sade hali — ülke/kıta yok (tek ülke/TR fazı); amaç başka kategorilerin millilerine bakmak.
 */
import { useState, useTransition, type ReactNode } from "react";
import { getNationalTeamAction } from "@/app/actions";
import { GENDERS, WEAPONS, makeCategoryId, type AgeCategory, type Gender, type Weapon } from "@/engine/domain";
import { t, type Locale } from "@/i18n";
import { Flag } from "./Flag";
import type { NationalTeamMemberDTO } from "@/server/careerService";

const AGES = ["U10", "U12", "U14", "U17", "U21", "SENIOR"];
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

export function MilliTakimFilter({
  initialCategoryId,
  initialMembers,
  countryCode,
  locale,
}: {
  initialCategoryId: string;
  initialMembers: NationalTeamMemberDTO[];
  countryCode: string;
  locale: Locale;
}) {
  const [age0, gCode, wCode] = initialCategoryId.split("-");
  const [age, setAge] = useState(age0);
  const [gender, setGender] = useState<Gender>(GENDER_FROM_CODE[gCode] ?? "MALE");
  const [weapon, setWeapon] = useState<Weapon>(WEAPON_FROM_CODE[wCode] ?? "FOIL");
  const [members, setMembers] = useState<NationalTeamMemberDTO[]>(initialMembers);
  const [pending, startTransition] = useTransition();

  const load = (a: string, g: Gender, w: Weapon) => {
    startTransition(async () => {
      setMembers(await getNationalTeamAction(makeCategoryId(a as AgeCategory, g, w)));
    });
  };

  const catLabel = `${t(locale, `country.${countryCode}`)} ${t(locale, `gender.${gender}`)} ${t(locale, `weapon.${weapon}`)} ${age}`;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-steel">{t(locale, "milli.pick")}</p>

      {/* Yaş çipleri (U10…U21 üst satır, Büyükler tam genişlik) — Klasman ile aynı dizilim */}
      <div className="grid grid-cols-5 gap-1.5">
        {AGES.map((a) => (
          <Chip
            key={a}
            on={age === a}
            className={a === "SENIOR" ? "col-span-5" : ""}
            onClick={() => {
              setAge(a);
              load(a, gender, weapon);
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
              load(age, gender, w);
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
              load(age, g, weapon);
            }}
          >
            {t(locale, `gender.${g}`)}
          </Chip>
        ))}
      </div>

      <div className="kicker flex items-center gap-1.5">
        <Flag code={countryCode} /> {catLabel}
      </div>

      {pending ? (
        <p className="flex items-center gap-2 text-[14px] text-steel">
          <span className="lamp bg-ink anim-live h-2 w-2" aria-hidden="true" />
          {t(locale, "klasman.loading")}
        </p>
      ) : members.length === 0 ? (
        <p className="panel p-3 text-[14px] text-steel">{t(locale, "milli.empty")}</p>
      ) : (
        <ol className="panel divide-y divide-line overflow-hidden">
          {members.map((m) => (
            <li
              key={m.playerId}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 text-[15px] ${m.isHuman ? "bg-arena-2 font-semibold" : ""}`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="num w-5 shrink-0 text-steel">{m.position}.</span>
                {/* Kendi adın "(sen)" yerine kendi renginle ayırt edilir (Ayarlar → Görünüm). */}
                <span className={`truncate ${m.isHuman ? "text-me" : ""}`}>{m.name}</span>
              </span>
              <span className="num shrink-0 text-[18px]">{m.rating.toFixed(1)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
