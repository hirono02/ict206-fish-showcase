import { fishDatabase, type FishId, type FishProfile } from "@/lib/fish-data";

export interface TankSetup {
  tankLitres: number;
  ph: number;
  tempC: number;
}

export interface StockingEntry {
  fishId: FishId;
  quantity: number;
}

export interface PairResult {
  fishAId: FishId;
  fishBId: FishId;
  fishAName: string;
  fishBName: string;
  compatible: boolean;
  reasons: string[];
  score: number;
}

export type OverallVerdict = "pending" | "recommended" | "caution" | "reconsider";

export interface EvaluationResult {
  avgScore: number;
  results: PairResult[];
  warnings: string[];
  incompatibleCount: number;
  overallVerdict: OverallVerdict;
}

interface SpecialIssue {
  message: string;
  penalty: number;
}

function phOverlap(fishAData: FishProfile, fishBData: FishProfile) {
  const low = Math.max(fishAData.minPh, fishBData.minPh);
  const high = Math.min(fishAData.maxPh, fishBData.maxPh);
  return Math.max(0, high - low);
}

function tempOverlap(fishAData: FishProfile, fishBData: FishProfile) {
  const low = Math.max(fishAData.minTempC, fishBData.minTempC);
  const high = Math.min(fishAData.maxTempC, fishBData.maxTempC);
  return Math.max(0, high - low);
}

function sizeRatio(fishAData: FishProfile, fishBData: FishProfile) {
  if (Math.min(fishAData.maxSizeCm, fishBData.maxSizeCm) === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return (
    Math.max(fishAData.maxSizeCm, fishBData.maxSizeCm) /
    Math.min(fishAData.maxSizeCm, fishBData.maxSizeCm)
  );
}

function checkSpecialRules(
  idA: FishId,
  idB: FishId,
  dataA: FishProfile,
  dataB: FishProfile,
) {
  const issues: SpecialIssue[] = [];

  if (dataA.speciesGroup === "betta" && dataB.speciesGroup === "betta") {
    issues.push({
      message: "Multiple Bettas will fight aggressively, especially males.",
      penalty: 50,
    });
  }

  const speciesGroups = new Set([dataA.speciesGroup, dataB.speciesGroup]);
  if (speciesGroups.has("betta") && speciesGroups.has("livebearer")) {
    if (idA === "guppy" || idB === "guppy" || idA === "endler_guppy" || idB === "endler_guppy") {
      issues.push({
        message:
          "Bettas may attack guppies or endlers because their flowing fins are treated like a rival display.",
        penalty: 25,
      });
    }
  }

  const tigerBarbs = new Set<FishId>(["tiger_barb"]);
  const longFinGroups = new Set(["betta", "gourami"]);
  const longFinSpecies = new Set<FishId>([
    "angelfish",
    "betta",
    "dwarf_gourami",
    "honey_gourami",
    "pearl_gourami",
  ]);

  if (
    (tigerBarbs.has(idA) &&
      (longFinGroups.has(dataB.speciesGroup) || longFinSpecies.has(idB))) ||
    (tigerBarbs.has(idB) &&
      (longFinGroups.has(dataA.speciesGroup) || longFinSpecies.has(idA)))
  ) {
    issues.push({
      message:
        "Tiger Barbs are notorious fin-nippers and can relentlessly harass long-finned species.",
      penalty: 40,
    });
  }

  if (
    (tigerBarbs.has(idA) && idB === "angelfish") ||
    (tigerBarbs.has(idB) && idA === "angelfish")
  ) {
    issues.push({
      message:
        "Angelfish are especially vulnerable because their long trailing fins invite repeated nipping.",
      penalty: 20,
    });
  }

  if (idA === "oscar" && dataB.maxSizeCm < 10) {
    issues.push({
      message: `Oscars will likely eat ${dataB.name} once the size gap widens.`,
      penalty: 40,
    });
  }

  if (idB === "oscar" && dataA.maxSizeCm < 10) {
    issues.push({
      message: `Oscars will likely eat ${dataA.name} once the size gap widens.`,
      penalty: 40,
    });
  }

  if (idA === "angelfish" && dataB.maxSizeCm <= 3.5) {
    issues.push({
      message: `Adult Angelfish may treat very small ${dataB.name} as prey.`,
      penalty: 20,
    });
  }

  if (idB === "angelfish" && dataA.maxSizeCm <= 3.5) {
    issues.push({
      message: `Adult Angelfish may treat very small ${dataA.name} as prey.`,
      penalty: 20,
    });
  }

  const coldWaterSpecies = new Set<FishId>(["white_cloud_minnow"]);
  const tropicalSpecies = new Set<FishId>([
    "betta",
    "cardinal_tetra",
    "discus",
    "german_blue_ram",
  ]);

  if (
    (coldWaterSpecies.has(idA) && tropicalSpecies.has(idB)) ||
    (coldWaterSpecies.has(idB) && tropicalSpecies.has(idA))
  ) {
    issues.push({
      message:
        "Cold-water species should not be mixed with tropical fish that require sustained high temperatures.",
      penalty: 30,
    });
  }

  const labyrinthGroups = new Set(["betta", "gourami"]);
  if (
    labyrinthGroups.has(dataA.speciesGroup) &&
    labyrinthGroups.has(dataB.speciesGroup) &&
    dataA.speciesGroup !== dataB.speciesGroup
  ) {
    issues.push({
      message:
        "Bettas and Gouramis are both labyrinth fish and may become territorial around the surface.",
      penalty: 30,
    });
  }

  return issues;
}

function getOverallVerdict(resultCount: number, incompatibleCount: number, warningCount: number): OverallVerdict {
  if (resultCount === 0 && warningCount === 0) {
    return "pending";
  }

  if (incompatibleCount > 0) {
    return "reconsider";
  }

  if (warningCount > 0) {
    return "caution";
  }

  return "recommended";
}

export function evaluateTank(tank: TankSetup, stocking: StockingEntry[]): EvaluationResult {
  const warnings: string[] = [];
  const results: PairResult[] = [];

  stocking.forEach(({ fishId, quantity }) => {
    const fish = fishDatabase[fishId];

    if (tank.tankLitres < fish.minTankLitres) {
      warnings.push(
        `Tank too small for ${fish.name}: it needs at least ${fish.minTankLitres}L, but the tank is ${tank.tankLitres}L.`,
      );
    }

    if (tank.ph < fish.minPh || tank.ph > fish.maxPh) {
      warnings.push(
        `Tank pH (${tank.ph.toFixed(1)}) sits outside the healthy range for ${fish.name} (${fish.minPh}-${fish.maxPh}).`,
      );
    }

    if (tank.tempC < fish.minTempC || tank.tempC > fish.maxTempC) {
      warnings.push(
        `Tank temperature (${tank.tempC}C) sits outside the healthy range for ${fish.name} (${fish.minTempC}-${fish.maxTempC}C).`,
      );
    }

    if (fish.schooling && quantity < 6) {
      warnings.push(
        `${fish.name} is a schooling species and should be kept in groups of at least 6. Current quantity: ${quantity}.`,
      );
    }

    if (fish.speciesGroup === "betta" && quantity > 1) {
      results.push({
        fishAId: fishId,
        fishBId: fishId,
        fishAName: fish.name,
        fishBName: fish.name,
        compatible: false,
        score: 0,
        reasons: [
          "Multiple Bettas, especially males, are highly likely to fight. Keep only one Betta per tank.",
        ],
      });
    }
  });

  for (let leftIndex = 0; leftIndex < stocking.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < stocking.length; rightIndex += 1) {
      const left = stocking[leftIndex];
      const right = stocking[rightIndex];
      const dataA = fishDatabase[left.fishId];
      const dataB = fishDatabase[right.fishId];
      const reasons: string[] = [];
      let score = 100;

      const phSpan = phOverlap(dataA, dataB);
      if (phSpan <= 0) {
        reasons.push(
          `No pH overlap: ${dataA.name} prefers ${dataA.minPh}-${dataA.maxPh}, while ${dataB.name} prefers ${dataB.minPh}-${dataB.maxPh}.`,
        );
        score -= 40;
      } else if (phSpan < 0.5) {
        reasons.push(`Very narrow pH overlap (${phSpan.toFixed(1)}). Stable maintenance could be difficult.`);
        score -= 20;
      }

      const tempSpan = tempOverlap(dataA, dataB);
      if (tempSpan <= 0) {
        reasons.push(
          `No temperature overlap: ${dataA.name} prefers ${dataA.minTempC}-${dataA.maxTempC}C, while ${dataB.name} prefers ${dataB.minTempC}-${dataB.maxTempC}C.`,
        );
        score -= 40;
      } else if (tempSpan < 2) {
        reasons.push(`Very narrow temperature overlap (${tempSpan.toFixed(1)}C).`);
        score -= 15;
      }

      const temperaments = new Set([dataA.temperament, dataB.temperament]);
      if (temperaments.has("aggressive") && temperaments.has("peaceful")) {
        reasons.push(
          `Temperament conflict: an aggressive species is paired with a peaceful one, increasing stress and attack risk.`,
        );
        score -= 35;
      } else if (temperaments.has("aggressive") && temperaments.has("semi-aggressive")) {
        reasons.push("Temperament caution: both species show aggressive tendencies.");
        score -= 20;
      } else if (temperaments.has("semi-aggressive") && temperaments.has("peaceful")) {
        reasons.push("Temperament caution: semi-aggressive behaviour may lead to bullying or fin damage.");
        score -= 15;
      }

      const ratio = sizeRatio(dataA, dataB);
      if (ratio >= 4) {
        const smaller = dataA.maxSizeCm < dataB.maxSizeCm ? dataA.name : dataB.name;
        const larger = smaller === dataA.name ? dataB.name : dataA.name;
        reasons.push(`Extreme size difference (${ratio.toFixed(1)}x): ${smaller} may be eaten by ${larger}.`);
        score -= 30;
      } else if (ratio >= 2.5) {
        reasons.push(
          `Significant size difference (${ratio.toFixed(1)}x): the smaller species may be harassed or stressed.`,
        );
        score -= 10;
      }

      checkSpecialRules(left.fishId, right.fishId, dataA, dataB).forEach((issue) => {
        reasons.push(issue.message);
        score -= issue.penalty;
      });

      const finalScore = Math.max(0, Math.min(100, score));
      results.push({
        fishAId: left.fishId,
        fishBId: right.fishId,
        fishAName: dataA.name,
        fishBName: dataB.name,
        compatible: finalScore >= 50,
        reasons: reasons.length > 0 ? reasons : ["No major compatibility issues detected."],
        score: finalScore,
      });
    }
  }

  const incompatibleCount = results.filter((result) => !result.compatible).length;
  const avgScore =
    results.length > 0
      ? Number((results.reduce((total, result) => total + result.score, 0) / results.length).toFixed(1))
      : 0;

  return {
    avgScore,
    results,
    warnings,
    incompatibleCount,
    overallVerdict: getOverallVerdict(results.length, incompatibleCount, warnings.length),
  };
}
