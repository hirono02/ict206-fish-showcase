"use client";

import dynamic from "next/dynamic";

const ShowcaseApp = dynamic(
  () => import("@/components/showcase-app").then((module) => module.ShowcaseApp),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Loading web application
          </p>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Freshwater Fish Compatibility Advisor
          </h1>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            Preparing the field guide interface, species catalogue, and compatibility report.
          </p>
        </div>
      </main>
    ),
  },
);

export default function Home() {
  return <ShowcaseApp />;
}
