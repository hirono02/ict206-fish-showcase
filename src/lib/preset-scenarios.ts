import type { FishId } from "@/lib/fish-data";

export interface ScenarioFish {
  fishId: FishId;
  quantity: number;
}

export interface ScenarioPreset {
  id: number;
  title: string;
  description: string;
  category: "compatible" | "incompatible" | "borderline" | "edge";
  expected: boolean;
  highlight: string;
  tankLitres: number;
  ph: number;
  tempC: number;
  fish: ScenarioFish[];
}

export const presetScenarios: ScenarioPreset[] = [
  {
    id: 1,
    title: "Peaceful community starter",
    description:
      "Neon Tetras and Corydoras make a classic beginner-friendly community tank.",
    category: "compatible",
    expected: true,
    highlight: "Clean overlap across size, temperament, pH, and swimming level.",
    tankLitres: 80,
    ph: 7,
    tempC: 25,
    fish: [
      { fishId: "neon_tetra", quantity: 8 },
      { fishId: "corydoras", quantity: 6 },
    ],
  },
  {
    id: 15,
    title: "Warm Amazon showcase",
    description:
      "A Discus and Cardinal Tetra pairing demonstrates the engine handling soft, warm-water setups.",
    category: "compatible",
    expected: true,
    highlight: "The profile sits in a narrow but healthy tropical window around pH 6.0 and 28C.",
    tankLitres: 250,
    ph: 6,
    tempC: 28,
    fish: [
      { fishId: "discus", quantity: 6 },
      { fishId: "cardinal_tetra", quantity: 10 },
    ],
  },
  {
    id: 23,
    title: "Betta vs guppy conflict",
    description:
      "A showcase of targeted domain rules around flowing fins, territoriality, and mistaken identity.",
    category: "incompatible",
    expected: false,
    highlight: "Special-case aggression rules stack on top of the normal pairwise score.",
    tankLitres: 40,
    ph: 7,
    tempC: 26,
    fish: [
      { fishId: "betta", quantity: 1 },
      { fishId: "guppy", quantity: 4 },
    ],
  },
  {
    id: 24,
    title: "Fin-nipper warning",
    description:
      "Tiger Barbs versus Bettas shows how the system flags long-finned species against known nippers.",
    category: "incompatible",
    expected: false,
    highlight: "A specific incompatibility rule drives the score sharply downward.",
    tankLitres: 80,
    ph: 7,
    tempC: 25,
    fish: [
      { fishId: "tiger_barb", quantity: 6 },
      { fishId: "betta", quantity: 1 },
    ],
  },
  {
    id: 36,
    title: "Borderline predator risk",
    description:
      "Angelfish with Neon Tetras looks attractive at first glance, but adult size changes the risk profile.",
    category: "borderline",
    expected: false,
    highlight: "The app explains why a visually calm tank can still fail the expert rules.",
    tankLitres: 150,
    ph: 7,
    tempC: 26,
    fish: [
      { fishId: "angelfish", quantity: 2 },
      { fishId: "neon_tetra", quantity: 10 },
    ],
  },
  {
    id: 47,
    title: "Layered community layout",
    description:
      "A three-species community demonstrates how the app compares multiple pairs and tank-level warnings together.",
    category: "edge",
    expected: true,
    highlight: "Useful for showcasing pair generation across several peaceful species.",
    tankLitres: 120,
    ph: 7,
    tempC: 25,
    fish: [
      { fishId: "neon_tetra", quantity: 8 },
      { fishId: "corydoras", quantity: 6 },
      { fishId: "bristlenose_pleco", quantity: 1 },
    ],
  },
  {
    id: 49,
    title: "Compatible fish, bad tank",
    description:
      "This preset separates compatibility from husbandry by keeping fish peaceful but shrinking the aquarium too far.",
    category: "edge",
    expected: true,
    highlight: "The expert system keeps pairwise compatibility positive while surfacing tank warnings.",
    tankLitres: 20,
    ph: 7,
    tempC: 25,
    fish: [
      { fishId: "neon_tetra", quantity: 8 },
      { fishId: "corydoras", quantity: 6 },
      { fishId: "guppy", quantity: 4 },
    ],
  },
];
