import { describe, it, expect } from "vitest";
import {
  LEDGER_MAX,
  appendLedger,
  encodeLedger,
  entriesForWeek,
  parseLedger,
  totals,
  weekOf,
  type LedgerEntry,
} from "@/engine/ledger";

const e = (day: number, key: string, amount: number): LedgerEntry => ({ day, key, amount });

describe("ledger — Kumbaram işlem kaydı", () => {
  it("parse: bozuk/boş → []", () => {
    expect(parseLedger(null)).toEqual([]);
    expect(parseLedger("")).toEqual([]);
    expect(parseLedger("{bozuk")).toEqual([]);
    expect(parseLedger("{}")).toEqual([]);
  });

  it("encode↔parse yuvarlak gider", () => {
    const l = [e(5, "ad", 2), e(5, "dues", -2)];
    expect(parseLedger(encodeLedger(l))).toEqual(l);
  });

  it("append LEDGER_MAX ile sınırlı (eskiler budanır)", () => {
    let l: LedgerEntry[] = [];
    for (let i = 0; i < LEDGER_MAX + 10; i++) l = appendLedger(l, e(i, "ad", 2));
    expect(l).toHaveLength(LEDGER_MAX);
    expect(l[0].day).toBe(10); // ilk 10 budandı
    expect(l[l.length - 1].day).toBe(LEDGER_MAX + 9);
  });

  it("weekOf: 7 gün = 1 hafta", () => {
    expect(weekOf(0)).toBe(0);
    expect(weekOf(6)).toBe(0);
    expect(weekOf(7)).toBe(1);
    expect(weekOf(13)).toBe(1);
    expect(weekOf(14)).toBe(2);
  });

  it("entriesForWeek: yalnız o haftanın kayıtları", () => {
    const l = [e(5, "ad", 2), e(6, "dues", -2), e(7, "prize", 6), e(13, "entry", -3)];
    const w0 = entriesForWeek(l, 6); // hafta 0 (gün 0–6)
    expect(w0.map((x) => x.day)).toEqual([5, 6]);
    const w1 = entriesForWeek(l, 10); // hafta 1 (gün 7–13)
    expect(w1.map((x) => x.day)).toEqual([7, 13]);
  });

  it("totals: gelir + / gider − / net", () => {
    const t = totals([e(1, "prize", 6), e(1, "ad", 2), e(1, "entry", -3), e(1, "equipment", -400)]);
    expect(t.income).toBe(8);
    expect(t.expense).toBe(-403);
    expect(t.net).toBe(-395);
  });
});
