"use client";

import dynamic from "next/dynamic";

const ShowcaseApp = dynamic(
  () => import("@/components/showcase-app").then((module) => module.ShowcaseApp),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl rounded-[2rem] border border-slate-200/70 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            Loading web application
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Rule-Based Expert System for Evaluating Freshwater Aquarium Fish Compatibility for Hobbyists
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Preparing the interactive compatibility evaluator, knowledge base, and report companion sections.
          </p>
        </div>
      </main>
    ),
  },
);

export default function Home() {
  return <ShowcaseApp />;
}
