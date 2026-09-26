# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Static portfolio site built with Astro. No client-side framework; the only JavaScript is the inline light/dark theme script in `src/layouts/Base.astro`. See `README.md` for where each piece of content lives and the full project frontmatter reference.

## Commands

Node version is pinned in `.node-version` (managed by fnm).

```sh
npm run dev       # http://localhost:4321
npm run build     # into dist/; also validates project frontmatter against the schema
npm run preview   # serve dist/
```

There are no tests or linter. `npm run build` is the check: a bad frontmatter field, a missing image, or a type error in an `.astro` file fails it.

## Architecture

- **Projects are a content collection** defined in `src/content.config.ts`. Each project is a folder `src/content/projects/<slug>/index.md`; the glob loader's `generateId` strips `/index.md`, so the folder name is the URL slug (`/projects/<slug>/`). Images sit beside `index.md` and are referenced relatively (`./fig.png`); `thumbnail` uses Astro's `image()` schema so it is optimized at build time.
- **Drafts** (`draft: true`) are filtered out in two places: the home page list (`src/pages/index.astro`) and `getStaticPaths` in `src/pages/projects/[slug].astro`. Any new page that lists projects must apply the same filter.
- **Home page** (`src/pages/index.astro`) combines `src/site.ts` (name, tagline, links), `src/bio.md` (imported as a component), and project tiles (`ProjectCard.astro`) sorted newest first by `date`.
- **Math**: `remark-math` + `rehype-katex` are wired in `astro.config.mjs`; the KaTeX stylesheet is imported only in `[slug].astro`, so math renders on project pages but not on the home page/bio.
- **Redirects** in `astro.config.mjs` keep URLs from the old al-folio site (`/projects/air_quality_geo_experiments/`, `/projects/`, `/cv/`) alive; a static build emits them as meta-refresh pages.
- **Theming**: color tokens are CSS variables at the top of `src/styles/global.css`, defined three times (light default, `prefers-color-scheme: dark` unless `data-theme='light'`, and explicit `data-theme='dark'`). Change dark colors in both dark blocks. Shiki emits both `github-light` and `github-dark-dimmed` (`defaultColor: false`) and `global.css` selects one per theme.

## Deploy

`.github/workflows/deploy.yml` builds with `npm ci && npm run build` and publishes `dist/` to GitHub Pages on push to `main`. `site` in `astro.config.mjs` is `https://iherman10.github.io` (used for canonical URLs).
