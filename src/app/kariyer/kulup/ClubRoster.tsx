"use client";

/**
 * Kulüp kadrosu — lisanslı sporcular listesi (kullanıcı kararı 15.11). Satır: online nokta (yeşil/kırmızı),
 * lisans no, ad soyad, yaş, silah, güçlü yön, cinsiyet (kısaltma). Overall GÖSTERİLMEZ. Üstte cinsiyet + silah
 * filtresi. Veri sunucudan prop ile gelir (getClubRoster).
 */
import { useMemo, useState } from "react";
import { t, type Locale } from "@/i18n";
import type { ClubRosterPlayerDTO } from "@/server/careerService";

const WEAPONS = ["EPEE", "FOIL", "SABRE"] as const;
const GENDERS = ["MALE", "FEMALE"] as const;

export function ClubRoster({ locale, players }: { locale: Locale; players: ClubRosterPlayerDTO[] }) {
  const [weapon, setWeapon] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);

  const filtered = useMemo(
    () => players.filter((p) => (!weapon || p.weapon === weapon) && (!gender || p.gender === gender)),
    [players, weapon, gender],
  );

  const chip = (active: boolean) =>
    `press min-h-9 rounded-md border px-2.5 text-[13px] ${active ? "border-ink bg-ink font-semibold text-arena-0" : "border-line text-steel"}`;

  // Cinsiyet kısaltması = çevrilmiş adın ilk harfi (Erkek→E, Kadın→K; Male→M…). Ayrı anahtar gerekmez.
  const genderShort = (g: string) => t(locale, `gender.${g}`).slice(0, 1).toLocaleUpperCase(locale);

  return (
    <div>
      {/* Filtreler: cinsiyet + silah (Hepsi = filtresiz) */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => setGender(null)} className={chip(gender === null)}>
          {t(locale, "roster.all")}
        </button>
        {GENDERS.map((g) => (
          <button key={g} type="button" onClick={() => setGender(gender === g ? null : g)} className={chip(gender === g)}>
            {t(locale, `gender.${g}`)}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <button type="button" onClick={() => setWeapon(null)} className={chip(weapon === null)}>
          {t(locale, "roster.all")}
        </button>
        {WEAPONS.map((w) => (
          <button key={w} type="button" onClick={() => setWeapon(weapon === w ? null : w)} className={chip(weapon === w)}>
            {t(locale, `weapon.${w}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-4 text-center text-[14px] text-steel">{t(locale, "roster.empty")}</p>
      ) : (
        <ul className="panel divide-y divide-line overflow-hidden">
          {filtered.map((p) => (
            <li
              key={p.code}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-[14px] ${p.isMe ? "bg-ink/[0.06]" : ""}`}
            >
              {/* Online nokta: yeşil = online, kırmızı = offline */}
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.online ? "bg-sig-green" : "bg-sig-red"}`}
                title={t(locale, p.online ? "roster.online" : "roster.offline")}
                aria-label={t(locale, p.online ? "roster.online" : "roster.offline")}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{p.name}</span>
                  {p.isMe && <span className="shrink-0 rounded border border-line px-1 text-[11px] text-steel">{t(locale, "roster.me")}</span>}
                </div>
                <div className="num text-[12px] text-steel">{p.code}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2.5 text-[13px]">
                <span className="num w-6 text-right text-steel">{p.age}</span>
                <span className="w-12 text-steel">{t(locale, `weapon.${p.weapon}`)}</span>
                <span className="w-14 text-steel">{t(locale, `profile.${p.profile}`)}</span>
                <span className="num w-4 text-center font-semibold">{genderShort(p.gender)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
