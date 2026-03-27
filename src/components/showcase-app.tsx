"use client";

/* eslint-disable @next/next/no-img-element */

/*
 * Home Page – Fish Compatibility Expert System
 * Design: "Field Guide" warm editorial / handbook style
 * - Lora serif headings, Nunito Sans body, DM Mono for data
 * - Warm cream bg, forest green primary, burnt sienna warnings
 * - Single-column editorial flow with guided steps
 * - Species cards with fish images and search/filter bar
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Fish,
  Droplets,
  Thermometer,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Info,
  ArrowRight,
  Waves,
  Search,
} from "lucide-react";
import { FISH_DATABASE, getCategories, type FishSpecies } from "@/lib/fishData";
import { evaluateTank, type CompatibilityReport, type PairResult, type TankWarning } from "@/lib/expertEngine";
import { getFishImage } from "@/lib/fishImages";

// Image URLs
const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/117166162/gMtsz9xfzbMJD2GxerqqUC/hero-aquarium-W8xrXgqdREY4LuSJnpe9JG.webp";
const DIVIDER_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/117166162/gMtsz9xfzbMJD2GxerqqUC/results-divider-KVFuRKkS75MC46jfzyycFg.webp";

function getSliderValue(value: number | readonly number[]) {
  return Array.isArray(value) ? (value[0] ?? 0) : value;
}

// ─── Sub-components ───

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? "#2d6a4f" : score >= 50 ? "#b8860b" : "#c45b28";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e8e0d4" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-mono text-sm font-medium" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function FishCard({
  fish,
  selected,
  quantity,
  onToggle,
  onQuantityChange,
}: {
  fish: FishSpecies;
  selected: boolean;
  quantity: number;
  onToggle: () => void;
  onQuantityChange: (q: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgUrl = getFishImage(fish.id);
  const tempBadge = fish.temperament === "peaceful" ? "bg-[#2d6a4f]/10 text-[#2d6a4f]"
    : fish.temperament === "semi-aggressive" ? "bg-[#b8860b]/10 text-[#b8860b]"
    : "bg-[#c45b28]/10 text-[#c45b28]";

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card
        className={`transition-all duration-300 border-2 overflow-hidden ${
          selected ? "border-[#2d6a4f] shadow-md bg-[#f5f0e8]" : "border-transparent hover:border-[#d4c9b8] bg-card"
        }`}
      >
        {/* Fish image */}
        <button onClick={onToggle} className="w-full block">
          <div className="relative w-full h-36 bg-[#e8e0d4] overflow-hidden">
            <div className="flex h-full w-full items-end bg-[linear-gradient(135deg,#d9e6dc_0%,#f5f0e8_54%,#e5dccf_100%)] p-4 text-left">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -right-4 -top-4 rounded-full bg-white/40 p-5">
                  <Fish className="h-14 w-14 text-[#2d6a4f]" />
                </div>
              </div>
              <div className="relative max-w-[11rem]">
                <p className="font-serif text-base font-semibold leading-tight text-[#1b4332]">
                  {fish.commonName}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-[#2d6a4f]/75">
                  {fish.category}
                </p>
              </div>
            </div>
            {imgUrl && !imageFailed && (
              <img
                src={imgUrl}
                alt={fish.commonName}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 hover:scale-105 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageFailed(true);
                  setImageLoaded(false);
                }}
              />
            )}
            {selected && (
              <div className="absolute top-2 right-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2d6a4f] text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
            )}
          </div>
        </button>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <button onClick={onToggle} className="text-left w-full">
                <h4 className="font-serif font-semibold text-base leading-tight text-foreground">
                  {fish.commonName}
                </h4>
                <p className="text-xs italic text-muted-foreground mt-0.5">{fish.scientificName}</p>
              </button>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${tempBadge}`}>
                  {fish.temperament}
                </span>
                <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {fish.sizeMin}–{fish.sizeMax} cm
                </span>
                {fish.schooling && (
                  <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    schooling ≥{fish.minSchoolSize}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                size="sm"
                variant={selected ? "default" : "outline"}
                onClick={onToggle}
                className={`h-8 text-xs ${selected ? "bg-[#2d6a4f] hover:bg-[#1b4332]" : ""}`}
              >
                {selected ? "Selected" : "Add"}
              </Button>
              {selected && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    className="w-6 h-6 rounded flex items-center justify-center bg-muted hover:bg-[#d4c9b8] transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-sm w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => onQuantityChange(quantity + 1)}
                    className="w-6 h-6 rounded flex items-center justify-center bg-muted hover:bg-[#d4c9b8] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Less" : "Details"}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{fish.description}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">pH</span><span className="font-mono">{fish.phMin}–{fish.phMax}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Temp</span><span className="font-mono">{fish.tempMin}–{fish.tempMax}°C</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Min Tank</span><span className="font-mono">{fish.minTankSize}L</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Swim Level</span><span className="font-mono">{fish.swimLevel}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Diet</span><span className="font-mono">{fish.diet}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-mono">{fish.category}</span></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PairResultCard({ result, fish1, fish2 }: { result: PairResult; fish1: FishSpecies; fish2: FishSpecies }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`border-l-4 ${result.compatible ? "border-l-[#2d6a4f]" : "border-l-[#c45b28]"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ScoreGauge score={result.score} size={52} />
            <div className="min-w-0">
              <p className="font-serif font-semibold text-sm truncate">
                {fish1.commonName} <span className="text-muted-foreground font-sans font-normal">&</span> {fish2.commonName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {result.compatible ? (
                  <Badge variant="outline" className="text-[10px] border-[#2d6a4f] text-[#2d6a4f] bg-[#2d6a4f]/5">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Compatible
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-[#c45b28] text-[#c45b28] bg-[#c45b28]/5">
                    <XCircle className="w-3 h-3 mr-1" /> Incompatible
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <Separator className="my-3" />
              {result.warnings.length > 0 ? (
                <ul className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-[#c45b28] shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{w}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
                  No compatibility issues detected between these species.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function TankWarningItem({ warning }: { warning: TankWarning }) {
  const icon = warning.severity === "danger" ? <XCircle className="w-4 h-4 text-[#c45b28]" />
    : warning.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-[#b8860b]" />
    : <Info className="w-4 h-4 text-[#2d6a4f]" />;

  const bg = warning.severity === "danger" ? "bg-[#c45b28]/5 border-[#c45b28]/20"
    : warning.severity === "warning" ? "bg-[#b8860b]/5 border-[#b8860b]/20"
    : "bg-[#2d6a4f]/5 border-[#2d6a4f]/20";

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${bg}`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <p className="text-sm">{warning.message}</p>
    </div>
  );
}

// ─── Main Page ───

export function ShowcaseApp() {
  // Tank parameters
  const [tankVolume, setTankVolume] = useState(100);
  const [tankPh, setTankPh] = useState(7.0);
  const [tankTemp, setTankTemp] = useState(25);

  // Fish selection: map of fishId -> quantity
  const [selectedFish, setSelectedFish] = useState<Record<string, number>>({});

  // Category filter
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Temperament filter
  const [activeTempFilter, setActiveTempFilter] = useState<string | null>(null);

  // Report
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [showReport, setShowReport] = useState(false);

  const categories = useMemo(() => getCategories(), []);

  const filteredFish = useMemo(() => {
    let result = FISH_DATABASE;

    // Category filter
    if (activeCategory) {
      result = result.filter(f => f.category === activeCategory);
    }

    // Temperament filter
    if (activeTempFilter) {
      result = result.filter(f => f.temperament === activeTempFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(f =>
        f.commonName.toLowerCase().includes(q) ||
        f.scientificName.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.diet.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeCategory, activeTempFilter, searchQuery]);

  const selectedCount = Object.keys(selectedFish).length;

  const toggleFish = useCallback((fishId: string) => {
    setSelectedFish(prev => {
      const next = { ...prev };
      if (next[fishId]) {
        delete next[fishId];
      } else {
        const fish = FISH_DATABASE.find(f => f.id === fishId);
        next[fishId] = fish?.schooling ? fish.minSchoolSize : 1;
      }
      return next;
    });
    setShowReport(false);
  }, []);

  const setQuantity = useCallback((fishId: string, qty: number) => {
    setSelectedFish(prev => ({ ...prev, [fishId]: qty }));
    setShowReport(false);
  }, []);

  const runAnalysis = useCallback(() => {
    const entries = Object.entries(selectedFish).map(([id, qty]) => ({
      species: FISH_DATABASE.find(f => f.id === id)!,
      quantity: qty,
    }));
    const result = evaluateTank(entries, tankVolume, tankPh, tankTemp);
    setReport(result);
    setShowReport(true);

    // Scroll to results
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [selectedFish, tankVolume, tankPh, tankTemp]);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero Section ─── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Watercolour aquarium illustration"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1b4332]/70 via-[#1b4332]/50 to-background" />
        </div>
        <div className="relative container py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Fish className="w-5 h-5 text-[#5bb5a2]" />
              <span className="text-sm font-medium tracking-wide uppercase text-[#a8d5c8]">Expert System</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Freshwater Fish<br />Compatibility Advisor
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#d4e8df] leading-relaxed max-w-xl">
              A rule-based expert system that evaluates whether your chosen fish can thrive together.
              Set your tank parameters, select species, and receive a detailed compatibility report.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Badge className="bg-[#2d6a4f]/80 text-white border-none text-xs">50 Species</Badge>
              <Badge className="bg-[#2d6a4f]/80 text-white border-none text-xs">5 Rule Dimensions</Badge>
              <Badge className="bg-[#2d6a4f]/80 text-white border-none text-xs">100% Accuracy</Badge>
            </div>
            <Button
              size="lg"
              className="mt-6 bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold shadow-lg"
              onClick={() => document.getElementById("tank-setup")?.scrollIntoView({ behavior: "smooth" })}
            >
              Begin Assessment <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </header>

      {/* ─── Step 1: Tank Parameters ─── */}
      <section id="tank-setup" className="container py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2d6a4f] text-white font-serif font-bold text-sm">1</span>
            <h2 className="font-serif text-2xl font-bold text-foreground">Configure Your Tank</h2>
          </div>
          <p className="text-muted-foreground ml-11 mb-8">
            Enter the physical parameters of your aquarium. These values determine which species can safely inhabit your tank.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 ml-11">
            {/* Volume */}
            <Card className="bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Droplets className="w-4 h-4 text-[#2d6a4f]" />
                  <span className="text-sm font-medium">Tank Volume</span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-mono text-3xl font-bold text-[#2d6a4f]">{tankVolume}</span>
                  <span className="text-sm text-muted-foreground">litres</span>
                </div>
                <Slider
                  value={[tankVolume]}
                  onValueChange={(value) => {
                    setTankVolume(getSliderValue(value));
                    setShowReport(false);
                  }}
                  min={10}
                  max={500}
                  step={5}
                  className="mt-2"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>10L</span><span>500L</span>
                </div>
              </CardContent>
            </Card>

            {/* pH */}
            <Card className="bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FlaskConical className="w-4 h-4 text-[#2d6a4f]" />
                  <span className="text-sm font-medium">Water pH</span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-mono text-3xl font-bold text-[#2d6a4f]">{tankPh.toFixed(1)}</span>
                </div>
                <Slider
                  value={[tankPh * 10]}
                  onValueChange={(value) => {
                    setTankPh(getSliderValue(value) / 10);
                    setShowReport(false);
                  }}
                  min={50}
                  max={90}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>5.0 (acidic)</span><span>9.0 (alkaline)</span>
                </div>
              </CardContent>
            </Card>

            {/* Temperature */}
            <Card className="bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="w-4 h-4 text-[#2d6a4f]" />
                  <span className="text-sm font-medium">Temperature</span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-mono text-3xl font-bold text-[#2d6a4f]">{tankTemp}</span>
                  <span className="text-sm text-muted-foreground">°C</span>
                </div>
                <Slider
                  value={[tankTemp]}
                  onValueChange={(value) => {
                    setTankTemp(getSliderValue(value));
                    setShowReport(false);
                  }}
                  min={10}
                  max={34}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>10°C</span><span>34°C</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>

      <Separator className="container" />

      {/* ─── Step 2: Fish Selection ─── */}
      <section className="container py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2d6a4f] text-white font-serif font-bold text-sm">2</span>
            <h2 className="font-serif text-2xl font-bold text-foreground">Select Your Fish</h2>
          </div>
          <p className="text-muted-foreground ml-11 mb-6">
            Browse the species catalogue below. Click a fish to add it to your tank, then adjust quantities as needed.
            {selectedCount > 0 && (
              <span className="ml-2 font-medium text-[#2d6a4f]">
                ({selectedCount} species selected)
              </span>
            )}
          </p>

          {/* Search bar */}
          <div className="ml-11 mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, species, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category filters */}
          <div className="ml-11 flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !activeCategory ? "bg-[#2d6a4f] text-white" : "bg-muted text-muted-foreground hover:bg-[#d4c9b8]"
              }`}
            >
              All Species
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat ? "bg-[#2d6a4f] text-white" : "bg-muted text-muted-foreground hover:bg-[#d4c9b8]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Temperament filters */}
          <div className="ml-11 flex flex-wrap gap-2 mb-6">
            <span className="text-xs text-muted-foreground self-center mr-1">Temperament:</span>
            {(["peaceful", "semi-aggressive", "aggressive"] as const).map(temp => {
              const colors = temp === "peaceful" ? "bg-[#2d6a4f] text-white" :
                temp === "semi-aggressive" ? "bg-[#b8860b] text-white" : "bg-[#c45b28] text-white";
              const inactiveColors = "bg-muted text-muted-foreground hover:bg-[#d4c9b8]";
              return (
                <button
                  key={temp}
                  onClick={() => setActiveTempFilter(activeTempFilter === temp ? null : temp)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTempFilter === temp ? colors : inactiveColors
                  }`}
                >
                  {temp}
                </button>
              );
            })}
          </div>

          {/* Results count */}
          <div className="ml-11 mb-4">
            <p className="text-xs text-muted-foreground">
              Showing {filteredFish.length} of {FISH_DATABASE.length} species
            </p>
          </div>

          {/* Fish grid */}
          <div className="ml-11 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFish.map(fish => (
              <FishCard
                key={fish.id}
                fish={fish}
                selected={!!selectedFish[fish.id]}
                quantity={selectedFish[fish.id] || 0}
                onToggle={() => toggleFish(fish.id)}
                onQuantityChange={(q) => setQuantity(fish.id, q)}
              />
            ))}
          </div>

          {/* No results message */}
          {filteredFish.length === 0 && (
            <div className="ml-11 py-12 text-center">
              <Fish className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">No species match your search. Try a different term or clear the filters.</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* ─── Analyse Button ─── */}
      {selectedCount > 0 && (
        <div className="container pb-8">
          <div className="ml-11">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold shadow-lg text-base px-8"
                onClick={runAnalysis}
              >
                <Waves className="w-5 h-5 mr-2" />
                Analyse Compatibility ({selectedCount} species)
              </Button>
            </motion.div>
          </div>
        </div>
      )}

      {/* ─── Step 3: Results ─── */}
      <AnimatePresence>
        {showReport && report && (
          <motion.section
            id="results-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
            className="container pb-16"
          >
            {/* Decorative divider */}
            <div className="mb-8">
              <img src={DIVIDER_IMG} alt="" className="w-full max-w-lg mx-auto h-16 object-contain opacity-60" />
            </div>

            <div className="ml-11">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2d6a4f] text-white font-serif font-bold text-sm">3</span>
                <h2 className="font-serif text-2xl font-bold text-foreground">Compatibility Report</h2>
              </div>

              {/* Overall summary card */}
              <Card className={`mt-6 border-2 ${report.overallCompatible ? "border-[#2d6a4f]/30 bg-[#2d6a4f]/5" : "border-[#c45b28]/30 bg-[#c45b28]/5"}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <ScoreGauge score={report.overallScore} size={100} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {report.overallCompatible ? (
                          <CheckCircle2 className="w-5 h-5 text-[#2d6a4f]" />
                        ) : (
                          <XCircle className="w-5 h-5 text-[#c45b28]" />
                        )}
                        <h3 className="font-serif font-bold text-lg">
                          {report.overallCompatible ? "Community Approved" : "Compatibility Issues Found"}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tank warnings */}
              {report.tankWarnings.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#b8860b]" />
                    Tank Warnings
                  </h3>
                  <div className="space-y-3">
                    {report.tankWarnings.map((w, i) => (
                      <TankWarningItem key={i} warning={w} />
                    ))}
                  </div>
                </div>
              )}

              {/* Pairwise results */}
              {report.pairResults.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
                    <Fish className="w-5 h-5 text-[#2d6a4f]" />
                    Pairwise Compatibility
                  </h3>
                  <div className="space-y-3">
                    {report.pairResults
                      .sort((a, b) => a.score - b.score)
                      .map((result, i) => {
                        const f1 = FISH_DATABASE.find(f => f.id === result.fish1)!;
                        const f2 = FISH_DATABASE.find(f => f.id === result.fish2)!;
                        return <PairResultCard key={i} result={result} fish1={f1} fish2={f2} />;
                      })}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-[#f5f0e8]">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Fish className="w-4 h-4 text-[#2d6a4f]" />
              <span className="font-serif font-semibold text-sm text-foreground">Fish Compatibility Expert System</span>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-right">
              ICT206 Intelligent Systems Project — Murdoch University, 2026.
              <br />
              Knowledge base: 50 species derived from PetCo, Aqueon, and SeriouslyFish.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
