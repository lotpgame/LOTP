"use client";

/**
 * Klasman filtresi: yaş/cinsiyet/silah seçerek herhangi bir kategorinin sıralamasına bak.
 * (Çok oyunculuda diğer kategoriler dolu olur; V1 tek-oyuncuda çoğu boş görünür.)
 */
import { useState, useTransition } from "react";
import { getCategoryRankingAction } from "@/app/actions";
import {
  GENDERS,
  GENDER_LABEL_TR,
  WEAPONS,
  WEAPON_LABEL_TR,
  makeCategoryId,
  type AgeCategory,
  type Gender,
  type Weapon,
} from "@/engine/domain";
import type { RankingRowDTO } from "@/server/careerService";

const AGES = ["U10", "U12", "U14", "U17", "U21", "SENIOR"];
const AGE_LABEL: Record<string, string> = {
  U10: "U10",
  U12: "U12",
  U14: "U14",
  U17: "U17",
  U21: "U21",
  SENIOR: "Senior",
};

const GENDER_FROM_CODE: Record<string, Gender> = { M: "MALE", F: "FEMALE" };
const WEAPON_FROM_CODE: Record<string, Weapon> = { FL: "FOIL", EPE: "EPEE", KIL: "SABRE" };

export function KlasmanFilter({
  initialCategoryId,
  initialRows,
}: {
  initialCategoryId: string;
  initialRows: RankingRowDTO[];
}) {
  const [age0, gCode, wCode] = initialCategoryId.split("-");
  const [age, setAge] = useState(age0);
  const [gender, setGender] = useState<Gender>(GENDER_FROM_CODE[gCode] ?? "MALE");
  const [weapon, setWeapon] = useState<Weapon>(WEAPON_FROM_CODE[wCode] ?? "FOIL");
  const [rows, setRows] = useState<RankingRowDTO[]>(initialRows);
  const [pending, startTransition] = useTransition();

  const load = (a: string, g: Gender, w: Weapon) => {
    startTransition(async () => {
      setRows(await getCategoryRankingAction(makeCategoryId(a as AgeCategory, g, w)));
    });
  };

  const selCls =
    "rounded-lg border border-black/15 bg-transparent px-2 py-2 text-sm outline-none focus:border-emerald-500 dark:border-white/20";

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={age}
          onChange={(e) => {
            setAge(e.target.value);
            load(e.target.value, gender, weapon);
          }}
          className={selCls}
        >
          {AGES.map((a) => (
            <option key={a} value={a}>
              {AGE_LABEL[a]}
            </option>
          ))}
        </select>
        <select
          value={gender}
          onChange={(e) => {
            const g = e.target.value as Gender;
            setGender(g);
            load(age, g, weapon);
          }}
          className={selCls}
        >
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {GENDER_LABEL_TR[g]}
            </option>
          ))}
        </select>
        <select
          value={weapon}
          onChange={(e) => {
            const w = e.target.value as Weapon;
            setWeapon(w);
            load(age, gender, w);
          }}
          className={selCls}
        >
          {WEAPONS.map((w) => (
            <option key={w} value={w}>
              {WEAPON_LABEL_TR[w]}
            </option>
          ))}
        </select>
      </div>

      {pending ? (
        <p className="mt-3 text-sm opacity-60">Yükleniyor…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-black/15 p-3 text-sm opacity-60 dark:border-white/20">
          Bu kategoride henüz yarışan yok. (Çok oyunculuda diğer oyuncularla dolacak.)
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
                {r.isHuman ? " (sen)" : ""}
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
