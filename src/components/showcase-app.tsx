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
    summary: "The selected fish community is working well across behaviour, water parameters, and tank needs.",
  },
  caution: {
    label: "Compatible with cautions",
    className: "border-amber-300 bg-amber-100 text-amber-800",
    summary: "The fish can live together, but husbandry issues still need attention before the tank is truly healthy.",
  },
  reconsider: {
    label: "High risk mix",
    className: "border-rose-300 bg-rose-100 text-rose-800",
    summary: "At least one pair fails the expert rules, so the stocking plan should be changed before setup.",
  },
};

const ruleHighlights = [
  {
    title: "Water overlap",
    body: "Each pair is checked for overlapping pH and temperature ranges. No overlap causes a steep penalty because there is no stable environment that suits both species.",
  },
  {
    title: "Temperament fit",
    body: "Peaceful, semi-aggressive, and aggressive profiles affect the score differently. Aggressive fish beside peaceful fish is one of the strongest conflict signals.",
  },
  {
    title: "Predation risk",
    body: "Large size ratios are treated as danger signals. Once the larger fish is 4x the size of the smaller one, the expert system assumes possible predation.",
  },
  {
    title: "Tank-level warnings",
    body: "Minimum tank size, live pH, live temperature, and schooling counts are evaluated independently from pair compatibility.",
  },
  {
    title: "Targeted domain rules",
    body: "The system carries specific heuristics such as Betta versus Guppy, Tiger Barb fin-nipping, Oscar predation, and cold-water versus tropical conflicts.",
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
                ICT206 Intelligent Systems Showcase
              </Badge>
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Rule-based aquarium expert system
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Explore a freshwater fish compatibility advisor built for real tank planning.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  This Next.js showcase turns the original Python expert system into an interactive web app. Build a tank,
                  test validated scenarios, and inspect how rules around pH, temperature, temperament, schooling, and
                  predation shape the final recommendation.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                  onClick={() => setActiveTab("lab")}
                >
                  Open tank lab
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full border border-slate-200 bg-white px-6 text-slate-700"
                  onClick={() => setActiveTab("presets")}
                >
                  Try preset scenarios
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ShowcaseMetric title="Knowledge Base" value="26" detail="Freshwater species encoded from the project dataset." />
                <ShowcaseMetric title="Validation Suite" value="50" detail="Reference scenarios used to evaluate the expert rules." />
                <ShowcaseMetric title="Model Style" value="Rule-Based" detail="Transparent scoring instead of black-box prediction." />
                <ShowcaseMetric title="Core Checks" value="6" detail="Water, behaviour, size, schooling, tank size, and special heuristics." />
              </div>
            </div>

            <Card className="border-slate-200/70 bg-slate-950 text-slate-50 shadow-xl">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="rounded-full border-white/15 bg-white/10 text-white">Live snapshot</Badge>
                  <span className="text-sm text-slate-300">{stocking.length} species selected</span>
                </div>
                <CardTitle className="text-2xl text-white">Current tank plan</CardTitle>
                <CardDescription className="text-slate-300">
                  {stocking.length > 0 ? formatSpeciesList(stocking) : "Add fish to start the compatibility analysis."}
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
              Tank Lab
            </TabsTrigger>
            <TabsTrigger value="presets" className="rounded-[1.2rem] py-3 text-sm font-semibold">
              Preset Cases
            </TabsTrigger>
            <TabsTrigger value="atlas" className="rounded-[1.2rem] py-3 text-sm font-semibold">
              Species Atlas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lab" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
              <Card className="border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-950">Build a tank</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    Adjust the aquarium profile, then mix species to see how the expert rules change in real time.
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
                    description="Volume affects minimum tank requirements and determines whether a stocking plan is physically realistic."
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
                    description="The rules look for overlapping pH ranges across every pair of species."
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
                    description="Warm tropical species can fail quickly if the safe temperature window is too narrow."
                    onChange={(value) => updateTank("tempC", value)}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Add a species</h3>
                      <p className="text-sm leading-6 text-slate-500">
                        The selector only lists fish that are not already in the tank.
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
                      <h3 className="text-lg font-semibold text-slate-900">Current stocking</h3>
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
                    <CardTitle className="text-2xl text-slate-950">Compatibility verdict</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">
                      The score below is generated from the same rule families described in the original expert system report.
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
                    <CardTitle className="text-2xl text-slate-950">Tank-level warnings</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">
                      These warnings are separate from pair compatibility, which helps distinguish fish conflicts from
                      husbandry problems.
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
                    <CardTitle className="text-2xl text-slate-950">Pairwise analysis</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">
                      Every unique fish pairing is scored from 0 to 100 with explicit reasons attached.
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
                <CardTitle className="text-2xl text-slate-950">Preset evaluation cases</CardTitle>
                <CardDescription className="text-base leading-7 text-slate-600">
                  These scenarios are adapted from the project’s broader validation set and designed to show compatible,
                  incompatible, borderline, and warning-heavy outcomes.
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
                    <CardTitle className="text-2xl text-slate-950">Species atlas</CardTitle>
                    <CardDescription className="text-base leading-7 text-slate-600">
                      Browse the fish knowledge base, then drop any species straight into the tank builder.
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
                  <CardTitle className="text-2xl text-slate-950">Validation evidence</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    The original project report validated the expert system on 50 curated scenarios.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Accuracy</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">100%</p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Scenario groups</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">4</p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Inference style</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Forward chaining</p>
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
                  <CardTitle className="text-2xl text-slate-950">Rulebook at a glance</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    The browser version mirrors the main reasoning dimensions from the Python expert system.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Waves className="size-4 text-sky-600" />
                    Water overlap
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    pH and temperature ranges are compared to ensure both fish can share one stable environment.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Fish className="size-4 text-emerald-600" />
                    Behaviour fit
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Temperament categories help flag bullying, stress, and aggressive territorial behaviour.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Database className="size-4 text-amber-600" />
                    Tank constraints
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Minimum litres, live pH, live temperature, and schooling counts are checked independently.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <TriangleAlert className="size-4 text-rose-500" />
                    Special heuristics
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Domain-specific knowledge handles Bettas, Oscars, Tiger Barbs, Angelfish, and cold-water mismatches.
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
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">Why this works</p>
              <h2 className="text-3xl font-semibold tracking-tight">A showcase built for explanation, not just output.</h2>
              <p className="max-w-3xl text-base leading-8 text-slate-300">
                Instead of returning a single yes or no answer, the app reveals the exact reasons behind each score. That
                makes it much easier to demonstrate the expert system’s interpretability during presentation or assessment.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-white">
                Transparent reasoning
              </Badge>
              <Badge className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-white">
                Responsive design
              </Badge>
              <Badge className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-white">
                GitHub Pages ready
              </Badge>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
