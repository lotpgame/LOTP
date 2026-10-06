"use client";

/** Oynanan turnuvalar listesi + Quarter (oyun yılı) filtresi (M11.4/UI). En yeni önce. */
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";

export interface HistoryTournament {
  id: number;
  name: string;
  level: string;
  categoryId: string;
  date: string;
  dateMs: number | null; // dünya gününün GMT başlangıcı — eski turnuvada yok (oyun-içi takvim tarihi gösterilmez)
  position: number;
  quarter: number;
  month: number;
}

// Derece kenarı — klasman kulesiyle aynı dil: 1. altın (tek prestij rengi), 2–3 çelik.
function placementEdge(pos: number): string {
  return pos === 1 ? "bg-prio" : pos === 2 || pos === 3 ? "bg-steel" : "";
}

export function TournamentsFilter({ tournaments, locale }: { tournaments: HistoryTournament[]; locale: Locale }) {
  const dateLoc = locale === "en" ? "en-GB" : "tr-TR";
  const quarters = useMemo(
    () => [...new Set(tournaments.map((t) => t.quarter))].sort((a, b) => b - a),
    [tournaments],
  );
  const [q, setQ] = useState<number | "all">("all");
  const shown = q === "all" ? tournaments : tournaments.filter((tr) => tr.quarter === q);

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[13px] text-steel">{t(locale, "gecmis.filter")}</span>
        <Chip on={q === "all"} onClick={() => setQ("all")}>
          {t(locale, "gecmis.filterAll")}
        </Chip>
        {quarters.map((qq) => (
          <Chip key={qq} on={q === qq} onClick={() => setQ(qq)}>
            Q{qq}
          </Chip>
        ))}
      </div>

      <ul className="mt-3 space-y-2">
        {shown.map((tour) => {
          const edge = placementEdge(tour.position);
          return (
            <li key={tour.id}>
              <Link
                href={`/turnuva/${tour.id}`}
                className="panel press relative flex min-h-14 items-center justify-between gap-3 overflow-hidden px-3 py-2.5"
              >
                {edge && <span className={`absolute inset-y-0 left-0 w-[3px] ${edge}`} aria-hidden="true" />}
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{tour.name}</span>
                  <span className="text-[13px] text-steel">
                    {tour.level} · Q{tour.quarter} · H{tour.month}
                    {tour.dateMs != null && ` · ${new Date(tour.dateMs).toLocaleDateString(dateLoc, { timeZone: "UTC" })}`}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`num text-[17px] ${tour.position >= 1 && tour.position <= 3 ? "font-semibold" : "text-steel"}`}>
                    {tour.position === 0 ? "—" : `${tour.position}.`}
                  </span>
                  <Icon name="chevron-right" size={18} className="text-steel" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

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
