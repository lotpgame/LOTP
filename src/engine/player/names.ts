/**
 * AI oyuncular için basit Türkçe isim havuzları (M1). İleride ülkeye göre genişler.
 */
import type { Gender } from "../domain";

const MALE_FIRST = [
  "Ahmet", "Mehmet", "Emre", "Can", "Kerem", "Yusuf", "Burak", "Deniz",
  "Kaan", "Ali", "Onur", "Berk", "Efe", "Mert", "Arda", "Tolga",
];

const FEMALE_FIRST = [
  "Zeynep", "Elif", "Ayşe", "Defne", "Ece", "Selin", "İrem", "Buse",
  "Naz", "Melis", "Ceren", "Aslı", "Sude", "Yağmur", "Gizem", "Beren",
];

const LAST = [
  "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk",
  "Aydın", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç",
  "Kurt", "Özdemir", "Şimşek", "Polat",
];

export function firstNamesFor(gender: Gender): readonly string[] {
  return gender === "MALE" ? MALE_FIRST : FEMALE_FIRST;
}

export const LAST_NAMES: readonly string[] = LAST;
