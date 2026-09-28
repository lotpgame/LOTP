/**
 * Taktik seçimi — 3 parçalı segment (Atak / Dengeli / Defans). JS gerektirmez: gerçek radio input'lar
 * (aynı name/value → sunucu aksiyonu değişmez), seçili olan mürekkep zeminle gösterilir.
 */
import { TACTICS } from "@/engine/combat";
import { t, type Locale } from "@/i18n";
import { Icon, type IconName } from "./Icon";

const TACTIC_ICON: Record<string, IconName> = { OFFENSIVE: "attack", BALANCED: "balanced", DEFENSIVE: "defence" };

export function TacticSegment({ name = "tactic", defaultValue, locale }: { name?: string; defaultValue: string; locale: Locale }) {
  return (
    <fieldset className="flex w-full rounded-md border border-line p-0.5">
      <legend className="sr-only">{t(locale, "turnuvalar.preTactic")}</legend>
      {TACTICS.map((tac) => (
        <label key={tac} className="relative flex-1 cursor-pointer">
          <input type="radio" name={name} value={tac} defaultChecked={tac === defaultValue} className="peer sr-only" />
          <span className="flex min-h-11 items-center justify-center gap-1.5 rounded-[5px] text-[14px] text-steel transition-colors peer-checked:bg-ink peer-checked:font-semibold peer-checked:text-arena-0 peer-focus-visible:ring-2 peer-focus-visible:ring-ink">
            <Icon name={TACTIC_ICON[tac] ?? "balanced"} size={17} />
            {t(locale, `tactic.${tac}`)}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
