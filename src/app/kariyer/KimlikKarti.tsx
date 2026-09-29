/**
 * Bugün sayfasının kimlik kartı (P1) — federasyon lisans kartı hissi veren, sayfanın kendi içeriği olan
 * bir kimlik gösterimi (CareerNav'daki ince kabuk şeridinden ayrı — o her sayfada, bu yalnız Bugün'de).
 * Yalnız KİMLİK bilgisi (silah/kategori/yaş/şehir/kod); performans (reyting/kondisyon/form) hemen
 * altındaki "Üç anahtar değer" bölümünde zaten var, burada tekrarlanmaz.
 */
import { t, type Locale } from "@/i18n";
import { Icon, weaponIcon } from "@/app/ui/Icon";
import { Flag } from "./Flag";
import { initials, toRoman } from "./parts";

export interface KimlikKartiProps {
  name: string;
  code: string;
  weapon: string;
  ageCategory: string;
  age: number;
  city: string;
  nationalTeam: boolean;
  seasonNo: number;
  locale: Locale;
}

export function KimlikKarti({ name, code, weapon, ageCategory, age, city, nationalTeam, seasonNo, locale }: KimlikKartiProps) {
  return (
    <section className="panel overflow-hidden border-t-2 border-t-ink p-4">
      <div className="flex items-center gap-3">
        <span
          className="mesh flex h-14 w-[3.25rem] shrink-0 items-center justify-center bg-ink font-display text-[22px] font-bold text-arena-0"
          style={{ borderRadius: "46% 46% 50% 50%" }}
          aria-hidden="true"
        >
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate font-display text-[20px] font-bold leading-tight">{name}</h2>
            {nationalTeam && (
              <span className="inline-flex items-center gap-1 rounded-md border border-prio/50 px-1.5 py-0.5 text-[12px] font-semibold text-prio">
                <Flag code="TR" /> {t(locale, "common.nationalTeam")}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[14px] text-steel">
            <span className="inline-flex items-center gap-1">
              <Icon name={weaponIcon(weapon)} size={15} /> {t(locale, `weapon.${weapon}`)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="num">{ageCategory}</span>
            <span aria-hidden="true">·</span>
            <span>
              {age} {t(locale, "common.age")}
            </span>
            {city && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Flag code="TR" /> {city}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-[12px] text-steel">
        <span className="num tracking-wide">
          {t(locale, "profil.licenseNo")} {code}
        </span>
        <span>
          {t(locale, "profil.season")} <span className="num text-ink">{toRoman(seasonNo)}</span>
        </span>
      </div>
    </section>
  );
}
