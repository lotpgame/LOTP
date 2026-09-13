/**
 * Başsız dengeleme simülasyonu — `npm run sim` (GDD 4.33).
 *
 * Saf engine'leri (DB'siz) kullanarak oyunun dengesini ölçer ve raporlar. Deterministik
 * (seed). Amaç: katsayıların makul olup olmadığını görmek — kazanma oranları, gelişim eğrisi,
 * sürpriz oranı, sakatlık sıklığı, turnuva rekabeti.
 *
 * Kullanım: `npm run sim` veya `npm run sim -- <seed>`.
 */
import { computeEffectiveStrength, createRng, type SeededRng } from "@/engine/probability";
import {
  SKILL_KEYS,
  generateStartingSkills,
  overall,
  type PlayerSkills,
  type SkillValue,
} from "@/engine/skill";
import { applyTraining, type TrainingType } from "@/engine/training";
import { simulateMatch, type Combatant } from "@/engine/combat";
import { simulateTournament } from "@/engine/tournament";
import { rollInjury } from "@/engine/conditioning";
import { clamp } from "@/engine/domain";

const SEED = process.argv[2] ?? "engarde-balance";

function flatSkills(current: number): PlayerSkills {
  const v: SkillValue = { current, potential: 100, floor: 0, ceiling: 100 };
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, { ...v }])) as PlayerSkills;
}

function line() {
  console.log("─".repeat(60));
}

/** 1) Combat: güç farkına göre güçlü oyuncunun kazanma oranı. */
function combatBalance() {
  line();
  console.log("1) COMBAT DENGESİ — güç farkına göre güçlü oyuncunun kazanma oranı (500 maç)");
  console.log("   Fark |  Kazanma %  | yorum");
  for (const gap of [0, 2, 4, 6, 8, 12, 20, 30]) {
    let wins = 0;
    const n = 500;
    for (let i = 0; i < n; i++) {
      const a: Combatant = { id: 1, name: "A", weapon: "EPEE", skills: flatSkills(60 + gap), fatigue: 0 };
      const b: Combatant = { id: 2, name: "B", weapon: "EPEE", skills: flatSkills(60), fatigue: 0 };
      if (simulateMatch(a, b, createRng(`${SEED}:cb:${gap}:${i}`), 15).winnerId === 1) wins++;
    }
    const pct = (wins / n) * 100;
    const note = pct >= 99 ? "neredeyse kesin" : pct <= 60 ? "başa baş" : "avantajlı";
    console.log(`   +${String(gap).padStart(2)} |    ${pct.toFixed(1).padStart(5)}%  | ${note}`);
  }
}

/** 2) Gelişim eğrisi: dengeli antrenmanla 4 quarter (48 hafta) sonrası overall. */
function developmentBalance() {
  line();
  console.log("2) GELİŞİM EĞRİSİ — 14 yaş, dengeli plan (Teknik+Fiziksel+Dinlenme), 48 hafta");
  const rng = createRng(`${SEED}:dev`);
  let skills = generateStartingSkills(rng, { age: 14, profile: "BALANCED" });
  const startOverall = overall(skills);
  const startPotential =
    SKILL_KEYS.reduce((a, k) => a + skills[k].potential, 0) / SKILL_KEYS.length;
  let fatigue = 0;
  const plan: TrainingType[] = ["TECHNICAL", "PHYSICAL", "REST"];
  const marks: Record<number, number> = {};
  for (let week = 1; week <= 48; week++) {
    for (const type of plan) {
      const res = applyTraining(skills, { type, age: 14 + Math.floor((week - 1) / 12), currentFatigue: fatigue });
      skills = res.skills;
      fatigue = clamp(fatigue + res.fatigueDelta, 0, 100);
    }
    if (week % 12 === 0) marks[week] = overall(skills);
  }
  console.log(`   Başlangıç overall: ${startOverall.toFixed(1)} (ort. potansiyel ${startPotential.toFixed(1)})`);
  for (const w of [12, 24, 36, 48]) console.log(`   ${w}. hafta: ${marks[w].toFixed(1)}`);
  console.log(`   Toplam gelişim: +${(marks[48] - startOverall).toFixed(1)} (${((marks[48] / startPotential) * 100).toFixed(0)}% potansiyel)`);
}

/** 3) Turnuva rekabeti: 24 oyunculu alanda şampiyon dağılımı (30 turnuva). */
function tournamentBalance() {
  line();
  console.log("3) TURNUVA REKABETİ — 24 oyuncu, 30 turnuva (havuz+eleme)");
  const rng = createRng(`${SEED}:field`);
  const field: Combatant[] = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: `P${i + 1}`,
    weapon: "FOIL",
    skills: generateStartingSkills(rng, { age: 18, profile: "BALANCED" }),
    fatigue: 0,
  }));
  // Güç sıralaması (referans)
  const strength = new Map(
    field.map((p) => [p.id, computeEffectiveStrength(p.skills, p.weapon, { fatigue: 0 }).total]),
  );
  const ranked = [...field].sort((a, b) => strength.get(b.id)! - strength.get(a.id)!);
  const top3 = new Set(ranked.slice(0, 3).map((p) => p.id));
  const champions = new Set<number>();
  let top3Wins = 0;
  const runs = 30;
  for (let i = 0; i < runs; i++) {
    const out = simulateTournament(field, createRng(`${SEED}:t:${i}`), { poolSize: 6 });
    champions.add(out.championId);
    if (top3.has(out.championId)) top3Wins++;
  }
  console.log(`   En güçlü 3 oyuncudan biri şampiyon: ${((top3Wins / runs) * 100).toFixed(0)}%`);
  console.log(`   Farklı şampiyon sayısı: ${champions.size} / ${runs} turnuva`);
}

/** 4) Sakatlık sıklığı: ağır vs dengeli plan, 24 hafta, 300 oyuncu. */
function injuryBalance() {
  line();
  console.log("4) SAKATLIK SIKLIĞI — 24 hafta, 300 oyuncu");
  const plans: Record<string, TrainingType[]> = {
    "Ağır (3× Fiziksel)": ["PHYSICAL", "PHYSICAL", "PHYSICAL"],
    "Dengeli (2 çalışma+dinlenme)": ["TECHNICAL", "PHYSICAL", "REST"],
  };
  for (const [name, plan] of Object.entries(plans)) {
    let injuredPlayers = 0;
    const players = 300;
    for (let p = 0; p < players; p++) {
      const rng: SeededRng = createRng(`${SEED}:inj:${name}:${p}`);
      let skills = generateStartingSkills(rng, { age: 18, profile: "BALANCED" });
      let fatigue = 0;
      let injured = false;
      for (let week = 1; week <= 24 && !injured; week++) {
        for (const type of plan) {
          const res = applyTraining(skills, { type, age: 18, currentFatigue: fatigue });
          skills = res.skills;
          fatigue = clamp(fatigue + res.fatigueDelta, 0, 100);
        }
        if (rollInjury(rng, fatigue, 18).injured) injured = true;
      }
      if (injured) injuredPlayers++;
    }
    console.log(`   ${name.padEnd(30)} → 24 haftada en az bir sakatlık: ${((injuredPlayers / players) * 100).toFixed(0)}%`);
  }
}

console.log(`\n=== PROJECT ENGARDE — DENGE RAPORU (seed: ${SEED}) ===`);
combatBalance();
developmentBalance();
tournamentBalance();
injuryBalance();
line();
console.log("Rapor tamam. Katsayılar ilgili engine dosyalarında ayarlanabilir.\n");
