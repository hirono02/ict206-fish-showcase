"use client";

import Image from "next/image";
import { startTransition, useDeferredValue, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Database,
  Fish,
  FlaskConical,
  Gauge,
  Plus,
  Search,
  ShieldCheck,
  Thermometer,
  Trash2,
  TriangleAlert,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fishDatabase, fishOptions, type FishId } from "@/lib/fish-data";
import {
  evaluateTank,
  type OverallVerdict,
  type StockingEntry,
  type TankSetup,
} from "@/lib/compatibility";
import { presetScenarios } from "@/lib/preset-scenarios";

type ActiveTab = "lab" | "presets" | "atlas";

const defaultTank: TankSetup = {
  tankLitres: 100,
  ph: 7,
  tempC: 25,
};

const defaultStocking: StockingEntry[] = [
  { fishId: "neon_tetra", quantity: 8 },
  { fishId: "corydoras", quantity: 6 },
];

const categoryBadgeClass: Record<(typeof presetScenarios)[number]["category"], string> = {
  compatible: "border-emerald-300 bg-emerald-100 text-emerald-800",
  incompatible: "border-rose-300 bg-rose-100 text-rose-800",
  borderline: "border-amber-300 bg-amber-100 text-amber-800",
  edge: "border-sky-300 bg-sky-100 text-sky-800",
};

const verdictCopy: Record<
  Exclude<OverallVerdict, "pending">,
  { label: string; className: string; summary: string }
> = {
  recommended: {
    label: "Recommended",
    className: "border-emerald-300 bg-emerald-100 text-emerald-800",
    summary:
      "The selected fish community is compatible based on water parameter overlap, temperament compatibility, size-ratio checks, behavioural rules, and tank constraints.",
  },
  caution: {
    label: "Compatible with cautions",
    className: "border-amber-300 bg-amber-100 text-amber-800",
    summary:
      "The fish can coexist, but the system has issued setup warnings regarding tank conditions or schooling requirements that should be addressed.",
  },
  reconsider: {
    label: "High risk mix",
    className: "border-rose-300 bg-rose-100 text-rose-800",
    summary:
      "At least one pairing falls below the compatibility threshold, so the stocking combination should be reconsidered before setup.",
  },
};

const ruleHighlights = [
  {
    title: "Water Parameter Overlap",
    body: "We calculate the overlap of tolerable pH and temperature ranges between a pair of fish. No overlap causes a heavy penalty because the fish cannot exist in the same water conditions.",
  },
  {
    title: "Temperament Compatibility",
    body: "The system penalises combinations of peaceful, semi-aggressive, and aggressive species depending on the likelihood of stress, bullying, or attack.",
  },
  {
    title: "Size Ratio (Predation/Bully Risk)",
    body: "We calculate the ratio of the larger fish’s maximum adult size to the smaller fish’s maximum adult size. Large gaps trigger penalties for predation, stress, or nipping risk.",
  },
  {
    title: "Special Domain Rules",
    body: "Specific behavioural patterns derived from expert knowledge, such as Betta aggression, Tiger Barb fin-nipping, and Angelfish predation on very small fish, are encoded as targeted rules.",
  },
  {
    title: "Tank Constraints",
    body: "Tank volume, water pH, water temperature, and schooling requirements are checked separately so the system can warn about poor setups even when the fish pairing itself is compatible.",
  },
];

function formatSpeciesList(stocking: StockingEntry[]) {
  return stocking
    .map((entry) => `${fishDatabase[entry.fishId].name} x${entry.quantity}`)
    .join(", ");
}

function ShowcaseMetric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function TankSlider({
  label,
  icon,
  value,
  min,
  max,
  step,
  suffix,
  description,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  description: string;
  onChange: (nextValue: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            {icon}
          </span>
          {label}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(nextValue) =>
          onChange(Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue)
        }
      />
      <p className="text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function ShowcaseApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("lab");
  const [tank, setTank] = useState<TankSetup>(defaultTank);
  const [stocking, setStocking] = useState<StockingEntry[]>(defaultStocking);
  const [pendingFishId, setPendingFishId] = useState<FishId | "">("");
  const [pendingQuantity, setPendingQuantity] = useState("6");
  const [atlasSearch, setAtlasSearch] = useState("");

  const deferredSearch = useDeferredValue(atlasSearch);
  const evaluation = evaluateTank(tank, stocking);
  const selectedIds = new Set(stocking.map((entry) => entry.fishId));
  const filteredFish = fishOptions.filter((fish) => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      fish.name.toLowerCase().includes(query) ||
      fish.scientificName.toLowerCase().includes(query) ||
      fish.speciesGroup.toLowerCase().includes(query) ||
      fish.temperament.toLowerCase().includes(query)
    );
  });

  function updateTank<Key extends keyof TankSetup>(key: Key, value: TankSetup[Key]) {
    setTank((currentTank) => ({
      ...currentTank,
      [key]: value,
    }));
  }

  function addFish(nextFishId: FishId, quantity: number) {
    setStocking((currentStocking) => {
      const existing = currentStocking.find((entry) => entry.fishId === nextFishId);

      if (existing) {
        return currentStocking.map((entry) =>
          entry.fishId === nextFishId
            ? { ...entry, quantity: Math.max(1, entry.quantity + quantity) }
            : entry,
        );
      }

      return [...currentStocking, { fishId: nextFishId, quantity: Math.max(1, quantity) }];
    });
  }

  function handleAddPendingFish() {
    if (!pendingFishId) {
      return;
    }

    const safeQuantity = Number.parseInt(pendingQuantity, 10);
    addFish(pendingFishId, Number.isNaN(safeQuantity) ? 1 : safeQuantity);
    setPendingFishId("");
    setPendingQuantity("6");
  }

  function updateQuantity(fishId: FishId, quantity: number) {
    setStocking((currentStocking) =>
      currentStocking.map((entry) =>
        entry.fishId === fishId ? { ...entry, quantity: Math.max(1, quantity) } : entry,
      ),
    );
  }

  function removeFish(fishId: FishId) {
    setStocking((currentStocking) => currentStocking.filter((entry) => entry.fishId !== fishId));
  }

  function applyPreset(presetId: number) {
    const preset = presetScenarios.find((candidate) => candidate.id === presetId);
    if (!preset) {
      return;
    }

    startTransition(() => {
      setTank({
        tankLitres: preset.tankLitres,
        ph: preset.ph,
        tempC: preset.tempC,
      });
      setStocking(preset.fish);
      setActiveTab("lab");
    });
  }

  const verdictDetails =
    evaluation.overallVerdict === "pending" ? null : verdictCopy[evaluation.overallVerdict];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.18),_transparent_26%),linear-gradient(180deg,_rgba(241,245,249,0.95),_rgba(248,250,252,0.72),_transparent)]" />
      <div className="pointer-events-none absolute left-10 top-24 size-64 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-56 size-80 rounded-full bg-teal-300/15 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
            <div className="space-y-6">
              <Badge className="rounded-full border-sky-200 bg-sky-100 px-3 py-1 text-sky-800">
                ICT206 Intelligent Systems Project
              </Badge>
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Project report web application
                </p>
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.85rem] lg:leading-[1.02]">
                  Rule-Based Expert System for Evaluating Freshwater Aquarium Fish Compatibility for Hobbyists
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                  This web application presents the design, implementation, as well as evaluation of a rule-based system
                  for assessing compatibility between aquarium fish species in community tank setups. The system encodes
                  domain and expert knowledge from established sources into a forward-chaining inference engine.
                </p>
                <p className="max-w-3xl text-base leading-8 text-slate-600">
                  The system accepts user input for tank parameters such as volume in litres, pH, and water temperature,
                  together with fish selections and quantities. The output is a compatibility summary that evaluates every
                  combination of selected species, provides a numerical score on a scale of 0-100, and issues specific
                  warnings regarding different tank and husbandry issues.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                  onClick={() => setActiveTab("lab")}
                >
                  Open web application
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full border border-slate-200 bg-white px-6 text-slate-700"
                  onClick={() => setActiveTab("presets")}
                >
                  View test scenarios
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ShowcaseMetric title="AI Method" value="Rule-Based" detail="A transparent expert system instead of a black-box prediction model." />
                <ShowcaseMetric title="Inference" value="Forward Chaining" detail="The engine evaluates all possible combinations from the user’s inputs." />
                <ShowcaseMetric title="Inputs" value="Tank + Fish" detail="Volume, pH, temperature, species selection, and quantity are all considered." />
                <ShowcaseMetric title="Output" value="0-100" detail="Each pairing receives a compatibility score together with warnings and reasons." />
              </div>
            </div>

            <Card className="border-slate-200/70 bg-slate-950 text-slate-50 shadow-xl">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="rounded-full border-white/15 bg-white/10 text-white">Web application</Badge>
                  <span className="text-sm text-slate-300">{stocking.length} species selected</span>
                </div>
                <CardTitle className="text-2xl text-white">Current tank setup</CardTitle>
                <CardDescription className="text-slate-300">
                  {stocking.length > 0
                    ? formatSpeciesList(stocking)
                    : "Add fish species and quantities to begin the compatibility assessment."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-white/6 p-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tank</p>
                    <p className="mt-2 text-xl font-semibold">{tank.tankLitres}L</p>
                  </div>
                  <div className="rounded-2xl bg-white/6 p-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">pH</p>
                    <p className="mt-2 text-xl font-semibold">{tank.ph.toFixed(1)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/6 p-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Temp</p>
                    <p className="mt-2 text-xl font-semibold">{tank.tempC}C</p>
                  </div>
                </div>

                {evaluation.overallVerdict === "pending" ? (
                  <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-5 text-sm leading-7 text-slate-300">
                    Add at least two species to unlock the full pairwise analysis. Tank-level warnings will still appear as
                    soon as the parameters fall outside a fish’s safe range.
                  </div>
                ) : (
                  <div className="space-y-4 rounded-3xl border border-white/10 bg-white/6 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge className={`rounded-full ${verdictDetails?.className}`}>{verdictDetails?.label}</Badge>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{verdictDetails?.summary}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Average score</p>
                        <p className="mt-2 text-3xl font-semibold text-white">{evaluation.avgScore || "--"}</p>
                      </div>
                    </div>
                    <Progress
                      value={evaluation.avgScore}
                      className="h-3 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-cyan-400 [&>div]:to-emerald-400"
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pairs checked</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{evaluation.results.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Warnings</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{evaluation.warnings.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk pairs</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{evaluation.incompatibleCount}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={(nextTab) => setActiveTab(nextTab as ActiveTab)} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-3xl border border-slate-200/70 bg-white/80 p-1 shadow-sm backdrop-blur">
            <TabsTrigger value="lab" className="rounded-[1.2rem] py-3 text-sm font-semibold">
              Web App
            </TabsTrigger>
            <TabsTrigger value="presets" className="rounded-[1.2rem] py-3 text-sm font-semibold">
              Test Cases
            </TabsTrigger>
            <TabsTrigger value="atlas" className="rounded-[1.2rem] py-3 text-sm font-semibold">
              Knowledge Base
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lab" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
              <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-950">User Input</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    The system accepts user input, primarily for tank parameters such as volume in litres, pH, and water
                    temperature, followed by fish selection and quantity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <TankSlider
                    label="Tank size"
                    icon={<Gauge className="size-4" />}
                    value={tank.tankLitres}
                    min={20}
                    max={320}
                    step={5}
                    suffix="L"
                    description="Tank volume is used for minimum tank size checks and overall setup suitability."
                    onChange={(value) => updateTank("tankLitres", value)}
                  />
                  <TankSlider
                    label="Water pH"
                    icon={<FlaskConical className="size-4" />}
                    value={tank.ph}
                    min={4.5}
                    max={8.5}
                    step={0.1}
                    suffix=""
                    description="The system checks whether the tank’s pH stays within each species’ tolerance range and whether pairwise pH overlap exists."
                    onChange={(value) => updateTank("ph", Number(value.toFixed(1)))}
                  />
                  <TankSlider
                    label="Temperature"
                    icon={<Thermometer className="size-4" />}
                    value={tank.tempC}
                    min={15}
                    max={31}
                    step={1}
                    suffix="C"
                    description="The system checks whether temperature overlaps exist and whether the chosen tank temperature is suitable for each fish."
                    onChange={(value) => updateTank("tempC", value)}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Fish Selection and Quantity</h3>
                      <p className="text-sm leading-6 text-slate-500">
                        Select species from the knowledge base and specify their quantities for community tank evaluation.
                      </p>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[1fr_120px_auto]">
                      <Select
                        value={pendingFishId}
                        onValueChange={(value) => setPendingFishId(value as FishId)}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                          <SelectValue placeholder="Choose a fish species" />
                        </SelectTrigger>
                        <SelectContent>
                          {fishOptions
                            .filter((fish) => !selectedIds.has(fish.fishId))
                            .map((fish) => (
                              <SelectItem key={fish.fishId} value={fish.fishId}>
                                {fish.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        className="h-12 rounded-2xl border-slate-200 bg-white"
                        value={pendingQuantity}
                        onChange={(event) => setPendingQuantity(event.target.value)}
                        aria-label="Fish quantity"
                      />
                      <Button
                        className="h-12 rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                        onClick={handleAddPendingFish}
                        disabled={!pendingFishId}
                      >
                        <Plus className="size-4" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">Selected Fish</h3>
                      <Badge className="rounded-full border-slate-200 bg-slate-100 text-slate-700">
                        {stocking.length} species
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {stocking.map((entry) => {
                        const fish = fishDatabase[entry.fishId];
                        return (
                          <div
                            key={entry.fishId}
                            className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-slate-50/70 p-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-slate-950">{fish.name}</p>
                                <Badge className="rounded-full border-slate-200 bg-white text-slate-600">
                                  {fish.temperament}
                                </Badge>
                                <Badge className="rounded-full border-slate-200 bg-white text-slate-600">
                                  {fish.swimmingLevel}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                pH {fish.minPh}-{fish.maxPh} • {fish.minTempC}-{fish.maxTempC}C • minimum tank {fish.minTankLitres}L
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={1}
                                className="h-11 w-24 rounded-2xl border-slate-200 bg-white"
                                value={entry.quantity}
                                onChange={(event) =>
                                  updateQuantity(
                                    entry.fishId,
                                    Number.parseInt(event.target.value, 10) || 1,
                                  )
                                }
                                aria-label={`${fish.name} quantity`}
                              />
                              <Button
                                variant="outline"
                                className="h-11 rounded-2xl border-slate-200 bg-white text-slate-600"
                                onClick={() => removeFish(entry.fishId)}
                              >
                                <Trash2 className="size-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-950">Compatibility Summary</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">
                      The output evaluates every combination of selected species, provides a numerical compatibility score
                      on a scale of 0-100, and classifies a pair as compatible or incompatible using the report’s scoring approach.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {evaluation.overallVerdict === "pending" ? (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                        Add at least two species to generate pairwise compatibility results. You can still preview tank
                        constraints by changing pH, temperature, and litres now.
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <Badge className={`rounded-full ${verdictDetails?.className}`}>{verdictDetails?.label}</Badge>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-500">Average score</p>
                            <p className="text-4xl font-semibold tracking-tight text-slate-950">
                              {evaluation.avgScore}
                            </p>
                          </div>
                        </div>
                        <Progress
                          value={evaluation.avgScore}
                          className="h-3 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-sky-500 [&>div]:to-teal-500"
                        />
                        <p className="text-sm leading-7 text-slate-600">{verdictDetails?.summary}</p>
                      </>
                    )}

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-500">Pairs evaluated</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                          {evaluation.results.length}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-500">Warnings</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                          {evaluation.warnings.length}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-500">Failed pairs</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                          {evaluation.incompatibleCount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-950">Tank Constraints</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">
                      These checks generate tank-level warnings rather than fish combination penalties, because they affect
                      the overall setup instead of only a single pairing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {evaluation.warnings.length === 0 ? (
                      <div className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                        <p className="text-sm leading-7">
                          No tank-level warnings were triggered for the current setup.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {evaluation.warnings.map((warning) => (
                          <div
                            key={warning}
                            className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
                          >
                            <TriangleAlert className="mt-0.5 size-5 shrink-0" />
                            <p className="text-sm leading-7">{warning}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-950">Pairwise Compatibility Analysis</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">
                      Every unique pairing is evaluated using cumulative penalties across water parameters, temperament,
                      size ratio, special domain rules, and tank-related checks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {evaluation.results.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                        Pair results appear here once there are at least two species in the tank or a same-species Betta
                        conflict to evaluate.
                      </div>
                    ) : (
                      evaluation.results.map((result) => (
                        <div key={`${result.fishAId}-${result.fishBId}`} className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-slate-950">
                                  {result.fishAName} + {result.fishBName}
                                </p>
                                <Badge
                                  className={`rounded-full ${
                                    result.compatible
                                      ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                                      : "border-rose-300 bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {result.compatible ? "Compatible" : "Incompatible"}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                Score penalties stack as the rule engine discovers conflicts.
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Score</p>
                              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{result.score}</p>
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            {result.reasons.map((reason) => (
                              <div key={reason} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                                {result.compatible ? (
                                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
                                )}
                                <p className="text-sm leading-7 text-slate-600">{reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-6">
              <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-950">Evaluation Method</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    Our test cases were designed to evaluate the system off fish stocking scenarios across clearly
                    compatible, clearly incompatible, borderline, and edge or outlier categories.
                  </CardDescription>
                </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                {presetScenarios.map((preset) => (
                  <div
                    key={preset.id}
                    className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge className={`rounded-full ${categoryBadgeClass[preset.category]}`}>
                        {preset.category}
                      </Badge>
                      <span className="text-sm font-medium text-slate-500">TC-{preset.id}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-950">{preset.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{preset.description}</p>
                    <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-slate-600 shadow-sm">
                      {preset.highlight}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {preset.fish.map((entry) => (
                        <Badge key={`${preset.id}-${entry.fishId}`} className="rounded-full border-slate-200 bg-white text-slate-600">
                          {fishDatabase[entry.fishId].name} x{entry.quantity}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        {preset.tankLitres}L • pH {preset.ph.toFixed(1)} • {preset.tempC}C
                      </p>
                      <Button
                        className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
                        onClick={() => applyPreset(preset.id)}
                      >
                        Apply preset
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atlas" className="space-y-6">
            <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl text-slate-950">Domain Knowledge Acquisition</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">
                      Domain knowledge was acquired from established aquarist sources such as PetCo, Aqueon, and
                      SeriouslyFish, then curated into a structured fish knowledge base.
                    </CardDescription>
                  </div>
                  <div className="relative w-full lg:max-w-sm">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={atlasSearch}
                      onChange={(event) => setAtlasSearch(event.target.value)}
                      placeholder="Search by name, group, or temperament"
                      className="h-12 rounded-2xl border-slate-200 bg-white pl-11"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredFish.map((fish) => (
                  <div
                    key={fish.fishId}
                    className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-950">{fish.name}</h3>
                        <p className="mt-2 text-sm italic text-slate-500">{fish.scientificName}</p>
                      </div>
                      <Badge className="rounded-full border-slate-200 bg-white text-slate-600">
                        {fish.temperament}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="rounded-full border-sky-200 bg-sky-100 text-sky-800">
                        {fish.speciesGroup}
                      </Badge>
                      <Badge className="rounded-full border-teal-200 bg-teal-100 text-teal-800">
                        {fish.swimmingLevel}
                      </Badge>
                      <Badge className="rounded-full border-amber-200 bg-amber-100 text-amber-800">
                        {fish.diet}
                      </Badge>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">pH</p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {fish.minPh}-{fish.maxPh}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Temp</p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {fish.minTempC}-{fish.maxTempC}C
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Size</p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {fish.minSizeCm}-{fish.maxSizeCm} cm
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Min tank</p>
                        <p className="mt-2 font-semibold text-slate-900">{fish.minTankLitres}L</p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-sm leading-6 text-slate-500">
                        {fish.schooling ? "Schooling species: best kept in groups of 6 or more." : "Can be kept without a full school."}
                      </p>
                      <Button
                        variant="outline"
                        className="rounded-full border-slate-200 bg-white text-slate-700"
                        onClick={() => addFish(fish.fishId, fish.schooling ? 6 : 1)}
                      >
                        <Plus className="size-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <BarChart3 className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-2xl text-slate-950">Results</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    The evaluation metric for this project was strictly based on system accuracy, with a target of 95%
                    or higher and an achieved result of 100%.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Target Accuracy</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">95%</p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Achieved Accuracy</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">100%</p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">False Positives / Negatives</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">0 / 0</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white shadow-sm">
                  <Image
                    src="/accuracy-chart.png"
                    alt="Accuracy by test category chart"
                    width={1100}
                    height={700}
                  className="h-auto w-full"
                  />
                </div>
                <p className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
                  The score distribution shows compatible pairs clustering in the higher ranges while incompatible pairs
                  cluster below the compatibility threshold, giving a clean separation around the score boundary.
                </p>
                <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white shadow-sm">
                  <Image
                    src="/confusion-matrix.png"
                    alt="Confusion matrix chart"
                    width={900}
                    height={900}
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <BookOpen className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-2xl text-slate-950">AI Method and Tools</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    The problem domain is governed by explicit, categorical rules, making a rule-based expert system a
                    suitable AI method for this project.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Waves className="size-4 text-sky-600" />
                    Water Parameter Overlap
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    We calculate the overlap of tolerable pH and temperature ranges between fish pairs and apply penalties
                    when those overlaps are missing or too narrow.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Fish className="size-4 text-emerald-600" />
                    Temperament Compatibility
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Peaceful, semi-aggressive, and aggressive fish combinations are penalised according to the risk of
                    stress, bullying, or aggression.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Database className="size-4 text-amber-600" />
                    Tank Constraints
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Minimum tank size, live pH, live temperature, and schooling requirements generate warnings about the
                    overall aquarium setup.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <TriangleAlert className="size-4 text-rose-500" />
                    Special Domain Rules
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Behavioural quirks such as Betta aggression, Tiger Barb fin-nipping, and Angelfish predation are
                    encoded as targeted rules on top of general compatibility checks.
                  </p>
                </div>
              </div>

              <Accordion
                defaultValue={[ruleHighlights[0].title]}
                className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 px-5"
              >
                {ruleHighlights.map((rule) => (
                  <AccordionItem key={rule.title} value={rule.title} className="border-slate-200/70">
                    <AccordionTrigger className="text-left text-base font-semibold text-slate-900">
                      {rule.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-slate-600">
                      {rule.body}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-[2rem] border border-slate-200/70 bg-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.48)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">Conclusion and future improvements</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                By delivering this system as a web application, it eliminates the barrier to entry.
              </h2>
              <p className="max-w-3xl text-base leading-8 text-slate-300">
                The gradual scoring mechanism provides a nuanced compatibility assessment instead of only a binary verdict,
                which makes the system more useful for handling borderline cases and communicating risk to hobbyists.
              </p>
              <p className="max-w-3xl text-sm leading-7 text-slate-400">
                Development acknowledged in the report includes Experta for the Python expert system, React, TypeScript,
                Tailwind CSS, shadcn/ui, and GitHub Pages for the web application, together with knowledge-base sources
                such as PetCo, Aqueon, and SeriouslyFish.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-white">
                Expand the knowledge base
              </Badge>
              <Badge className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-white">
                Add a fuzzy logic component
              </Badge>
              <Badge className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-white">
                User accounts and saved tanks
              </Badge>
              <Badge className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-white">
                Suggest alternative species
              </Badge>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
