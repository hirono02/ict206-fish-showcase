# Aquarium Compatibility Showcase

Interactive Next.js showcase for an ICT206 rule-based expert system that evaluates freshwater aquarium fish compatibility.

The site includes:

- a live tank builder
- preset validation scenarios
- a searchable fish knowledge base
- explainable pairwise scoring and tank warnings

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Static export for GitHub Pages

## Local Development

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
npm run build
```

The app uses `output: "export"` in [`next.config.ts`](./next.config.ts), so a static site is written to `out/`.

## GitHub Pages

This repo includes [`deploy-pages.yml`](./.github/workflows/deploy-pages.yml), which uses the current GitHub Pages Actions flow:

1. Push the repo to GitHub on the `main` branch.
2. In the repository settings, set Pages to use GitHub Actions as the source.
3. The workflow will build the app and publish the `out/` folder automatically.

The app derives `basePath` and `assetPrefix` from `GITHUB_REPOSITORY`, so it works for standard project-page URLs like:

`https://username.github.io/repository-name/`

## Notes

- The charts in `public/` were copied from the original project artifacts so the deployed site can show the report validation visuals.
- A `.nojekyll` file is included to avoid underscore-folder issues on GitHub Pages.
