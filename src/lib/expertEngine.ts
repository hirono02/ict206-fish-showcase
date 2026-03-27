/*
 * Expert System Inference Engine
 * Design: "Field Guide" editorial style
 * Implements forward-chaining rule evaluation for fish compatibility.
 */

import { type FishSpecies } from "./fishData";

export interface PairResult {
  fish1: string;
  fish2: string;
  score: number;
  compatible: boolean;
  warnings: string[];
  details: {
    waterOverlap: boolean;
    temperamentOk: boolean;
    sizeOk: boolean;
    specialRules: string[];
  };
}

export interface TankWarning {
  type: "tank_size" | "schooling" | "water_param" | "general";
  message: string;
  severity: "info" | "warning" | "danger";
}

export interface CompatibilityReport {
  pairResults: PairResult[];
  tankWarnings: TankWarning[];
  overallScore: number;
  overallCompatible: boolean;
  summary: string;
}

// ─── Helper functions ───

function rangeOverlap(min1: number, max1: number, min2: number, max2: number): [number, number] | null {
  const lo = Math.max(min1, min2);
  const hi = Math.min(max1, max2);
  return lo <= hi ? [lo, hi] : null;
}

function sizeRatio(fish1: FishSpecies, fish2: FishSpecies): number {
  const avg1 = (fish1.sizeMin + fish1.sizeMax) / 2;
  const avg2 = (fish2.sizeMin + fish2.sizeMax) / 2;
  return avg1 >= avg2 ? avg1 / avg2 : avg2 / avg1;
}

// ─── Special rules (domain heuristics) ───

const LONG_FINNED = new Set(["betta", "angelfish", "guppy", "endler_guppy"]);
const LABYRINTH = new Set(["betta", "dwarf_gourami", "pearl_gourami", "honey_gourami", "three_spot_gourami", "sparkling_gourami"]);
const FIN_NIPPERS = new Set(["tiger_barb", "serpae_tetra", "black_skirt_tetra"]);
const COLDWATER = new Set(["white_cloud_minnow"]);
const SHRIMP = new Set(["amano_shrimp", "cherry_shrimp"]);
const LARGE_PREDATORS = new Set(["oscar", "convict_cichlid"]);
const ARMOURED_SPECIES = new Set(["common_pleco", "bristlenose_pleco", "clown_loach"]);
const SHRIMP_PREDATOR_LOACHES = new Set(["yoyo_loach", "clown_loach", "dwarf_chain_loach"]);
const MEDIUM_PREDATOR_CICHLIDS = new Set(["electric_blue_acara"]);

function applySpecialRules(f1: FishSpecies, f2: FishSpecies): { penalty: number; warnings: string[] } {
  let penalty = 0;
  const warnings: string[] = [];

  // Betta vs Betta
  if (f1.id === "betta" && f2.id === "betta") {
    penalty += 80;
    warnings.push("Male Bettas will fight each other to the death. Never house two Bettas together.");
  }

  // Labyrinth fish territorial conflict
  if (f1.id !== f2.id && LABYRINTH.has(f1.id) && LABYRINTH.has(f2.id)) {
    penalty += 30;
    warnings.push(`${f1.commonName} and ${f2.commonName} are both labyrinth fish and may be territorial towards each other.`);
  }

  // Fin-nippers vs long-finned
  if (FIN_NIPPERS.has(f1.id) && LONG_FINNED.has(f2.id)) {
    penalty += 35;
    warnings.push(`${f1.commonName} is a notorious fin-nipper and will harass the long-finned ${f2.commonName}.`);
  }
  if (FIN_NIPPERS.has(f2.id) && LONG_FINNED.has(f1.id)) {
    penalty += 35;
    warnings.push(`${f2.commonName} is a notorious fin-nipper and will harass the long-finned ${f1.commonName}.`);
  }

  // Goldfish (coldwater) with tropical fish
  if (COLDWATER.has(f1.id) && !COLDWATER.has(f2.id)) {
    penalty += 40;
    warnings.push(`${f1.commonName} is a coldwater species and should not be kept with tropical ${f2.commonName}.`);
  }
  if (COLDWATER.has(f2.id) && !COLDWATER.has(f1.id)) {
    penalty += 40;
    warnings.push(`${f2.commonName} is a coldwater species and should not be kept with tropical ${f1.commonName}.`);
  }

  // Large predator vs small fish (armoured species exempt)
  if (LARGE_PREDATORS.has(f1.id) && (f2.sizeMin + f2.sizeMax) / 2 < 10 && !ARMOURED_SPECIES.has(f2.id)) {
    penalty += 50;
    warnings.push(`${f1.commonName} will likely eat or attack the small ${f2.commonName}.`);
  }
  if (LARGE_PREDATORS.has(f2.id) && (f1.sizeMin + f1.sizeMax) / 2 < 10 && !ARMOURED_SPECIES.has(f1.id)) {
    penalty += 50;
    warnings.push(`${f2.commonName} will likely eat or attack the small ${f1.commonName}.`);
  }

  // Shrimp predation risk — loaches are known shrimp hunters; most fish above 8cm will eat shrimp
  if (SHRIMP.has(f1.id)) {
    const isLoachPredator = SHRIMP_PREDATOR_LOACHES.has(f2.id);
    if (isLoachPredator || (f2.sizeMin + f2.sizeMax) / 2 > 8) {
      const p = isLoachPredator ? 45 : 30;
      penalty += p;
      warnings.push(`${f2.commonName} is known to prey on shrimp like ${f1.commonName}.`);
    }
  }
  if (SHRIMP.has(f2.id)) {
    const isLoachPredator = SHRIMP_PREDATOR_LOACHES.has(f1.id);
    if (isLoachPredator || (f1.sizeMin + f1.sizeMax) / 2 > 8) {
      const p = isLoachPredator ? 45 : 30;
      penalty += p;
      warnings.push(`${f1.commonName} is known to prey on shrimp like ${f2.commonName}.`);
    }
  }

  // Semi-aggressive cichlids may eat very small fish
  if (MEDIUM_PREDATOR_CICHLIDS.has(f1.id) && f2.sizeMax <= 3.0) {
    penalty += 25;
    warnings.push(`${f1.commonName} may prey on very small ${f2.commonName}.`);
  }
  if (MEDIUM_PREDATOR_CICHLIDS.has(f2.id) && f1.sizeMax <= 3.0) {
    penalty += 25;
    warnings.push(`${f2.commonName} may prey on very small ${f1.commonName}.`);
  }

  // Convict Cichlid same-species aggression when breeding
  if (f1.id === "convict_cichlid" && f2.id === "convict_cichlid") {
    penalty += 20;
    warnings.push("Convict Cichlid pairs become extremely aggressive when breeding and may attack all tankmates.");
  }

  return { penalty, warnings };
}

// ─── Pairwise compatibility evaluation ───

function evaluatePair(f1: FishSpecies, f2: FishSpecies): PairResult {
  let score = 100;
  const warnings: string[] = [];

  // 1. Water parameter overlap
  const phOverlap = rangeOverlap(f1.phMin, f1.phMax, f2.phMin, f2.phMax);
  const tempOverlap = rangeOverlap(f1.tempMin, f1.tempMax, f2.tempMin, f2.tempMax);
  const waterOk = phOverlap !== null && tempOverlap !== null;

  if (!phOverlap) {
    score -= 40;
    warnings.push(`pH ranges do not overlap: ${f1.commonName} (${f1.phMin}–${f1.phMax}) vs ${f2.commonName} (${f2.phMin}–${f2.phMax}).`);
  } else {
    const phRange = phOverlap[1] - phOverlap[0];
    if (phRange < 0.5) {
      score -= 10;
      warnings.push(`Very narrow pH overlap (${phOverlap[0].toFixed(1)}–${phOverlap[1].toFixed(1)}) between ${f1.commonName} and ${f2.commonName}.`);
    }
  }

  if (!tempOverlap) {
    score -= 40;
    warnings.push(`Temperature ranges do not overlap: ${f1.commonName} (${f1.tempMin}–${f1.tempMax}°C) vs ${f2.commonName} (${f2.tempMin}–${f2.tempMax}°C).`);
  } else {
    const tempRange = tempOverlap[1] - tempOverlap[0];
    if (tempRange < 2) {
      score -= 10;
      warnings.push(`Very narrow temperature overlap (${tempOverlap[0]}–${tempOverlap[1]}°C) between ${f1.commonName} and ${f2.commonName}.`);
    }
  }

  // 2. Temperament compatibility
  let temperamentOk = true;
  if (f1.temperament === "aggressive" && f2.temperament === "peaceful") {
    score -= 35;
    temperamentOk = false;
    warnings.push(`${f1.commonName} (aggressive) will likely bully the peaceful ${f2.commonName}.`);
  } else if (f2.temperament === "aggressive" && f1.temperament === "peaceful") {
    score -= 35;
    temperamentOk = false;
    warnings.push(`${f2.commonName} (aggressive) will likely bully the peaceful ${f1.commonName}.`);
  } else if (f1.temperament === "aggressive" && f2.temperament === "aggressive") {
    score -= 20;
    warnings.push(`Both ${f1.commonName} and ${f2.commonName} are aggressive — territorial conflicts are likely.`);
  } else if (
    (f1.temperament === "semi-aggressive" && f2.temperament === "peaceful") ||
    (f2.temperament === "semi-aggressive" && f1.temperament === "peaceful")
  ) {
    score -= 10;
    warnings.push(`Mixing semi-aggressive (${f1.temperament === "semi-aggressive" ? f1.commonName : f2.commonName}) with peaceful species — monitor for aggression.`);
  }

  // 3. Size ratio (predation risk) — armoured species exempt
  const ratio = sizeRatio(f1, f2);
  const eitherArmoured = ARMOURED_SPECIES.has(f1.id) || ARMOURED_SPECIES.has(f2.id);
  let sizeOk = true;
  if (ratio > 4.0 && !eitherArmoured) {
    score -= 30;
    sizeOk = false;
    warnings.push(`Dangerous size difference (${ratio.toFixed(1)}x) — the larger fish may eat the smaller one.`);
  } else if (ratio > 2.5) {
    score -= 15;
    warnings.push(`Significant size difference (${ratio.toFixed(1)}x) — the smaller fish may be stressed or outcompeted.`);
  }

  // 4. Special domain rules
  const special = applySpecialRules(f1, f2);
  score -= special.penalty;
  warnings.push(...special.warnings);

  score = Math.max(0, Math.min(100, score));

  return {
    fish1: f1.id,
    fish2: f2.id,
    score,
    compatible: score >= 50,
    warnings,
    details: {
      waterOverlap: waterOk,
      temperamentOk,
      sizeOk,
      specialRules: special.warnings,
    },
  };
}

// ─── Full tank evaluation ───

export function evaluateTank(
  selectedFish: Array<{ species: FishSpecies; quantity: number }>,
  tankVolume: number,
  tankPh: number,
  tankTemp: number
): CompatibilityReport {
  const pairResults: PairResult[] = [];
  const tankWarnings: TankWarning[] = [];

  // Tank-level checks
  for (const entry of selectedFish) {
    const fish = entry.species;

    // Tank size check
    if (tankVolume < fish.minTankSize) {
      tankWarnings.push({
        type: "tank_size",
        message: `${fish.commonName} requires at least ${fish.minTankSize}L — your tank (${tankVolume}L) is too small.`,
        severity: "danger",
      });
    }

    // Water parameter check
    if (tankPh < fish.phMin || tankPh > fish.phMax) {
      tankWarnings.push({
        type: "water_param",
        message: `Tank pH (${tankPh}) is outside ${fish.commonName}'s tolerable range (${fish.phMin}–${fish.phMax}).`,
        severity: "warning",
      });
    }
    if (tankTemp < fish.tempMin || tankTemp > fish.tempMax) {
      tankWarnings.push({
        type: "water_param",
        message: `Tank temperature (${tankTemp}°C) is outside ${fish.commonName}'s tolerable range (${fish.tempMin}–${fish.tempMax}°C).`,
        severity: "warning",
      });
    }

    // Schooling check
    if (fish.schooling && entry.quantity < fish.minSchoolSize) {
      tankWarnings.push({
        type: "schooling",
        message: `${fish.commonName} is a schooling fish — keep at least ${fish.minSchoolSize} individuals (you have ${entry.quantity}).`,
        severity: "warning",
      });
    }
  }

  // Pairwise evaluation
  for (let i = 0; i < selectedFish.length; i++) {
    for (let j = i + 1; j < selectedFish.length; j++) {
      pairResults.push(evaluatePair(selectedFish[i].species, selectedFish[j].species));
    }
  }

  // Same-species check for Bettas
  for (const entry of selectedFish) {
    if (entry.species.id === "betta" && entry.quantity > 1) {
      pairResults.push(evaluatePair(entry.species, entry.species));
    }
  }

  // Overall score
  let overallScore = 100;
  if (pairResults.length > 0) {
    overallScore = Math.round(pairResults.reduce((sum, r) => sum + r.score, 0) / pairResults.length);
  }
  // Penalise for tank warnings
  const dangerCount = tankWarnings.filter(w => w.severity === "danger").length;
  const warnCount = tankWarnings.filter(w => w.severity === "warning").length;
  overallScore = Math.max(0, overallScore - dangerCount * 15 - warnCount * 5);

  const overallCompatible = overallScore >= 50 && pairResults.every(r => r.compatible);

  let summary: string;
  if (selectedFish.length === 0) {
    summary = "No fish selected. Please add fish to your tank to begin the compatibility assessment.";
  } else if (selectedFish.length === 1 && !(selectedFish[0].species.id === "betta" && selectedFish[0].quantity > 1)) {
    summary = `Single species selected: ${selectedFish[0].species.commonName}. No compatibility conflicts, but check tank warnings above.`;
  } else if (overallCompatible && tankWarnings.length === 0) {
    summary = "Excellent community! All selected species are compatible and your tank parameters are suitable.";
  } else if (overallCompatible) {
    summary = "Species are compatible with each other, but please address the tank warnings listed above.";
  } else {
    const incompatCount = pairResults.filter(r => !r.compatible).length;
    summary = `${incompatCount} incompatible pairing${incompatCount > 1 ? "s" : ""} detected. Review the detailed results below and consider alternative species.`;
  }

  return { pairResults, tankWarnings, overallScore, overallCompatible, summary };
}
