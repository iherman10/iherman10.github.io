# personal-site

Portfolio site built with [Astro](https://astro.build). Static HTML, no client-side
framework; the only JavaScript is the light/dark toggle.

## Run it locally

Node is pinned in `.node-version` and managed by fnm (see `~/code/dev-setup/SETUP.md`).

```sh
npm install        # first time, or after pulling dependency changes
npm run dev        # http://localhost:4321, reloads on save
npm run build      # production build into dist/
npm run preview    # serve dist/ to check the production build
```

## Edit the content

| What | Where |
|---|---|
| Name, tagline, header links | `src/site.ts` |
| Bio | `src/bio.md` |
| Projects | `src/content/projects/<slug>/index.md` |
| Styling and colors | `src/styles/global.css` (theme tokens at the top) |

## Add a project

Make a folder named after the URL you want (`/projects/<slug>/`) with an `index.md` and any
images next to it:

```
src/content/projects/churn-model/
  index.md
  thumbnail.png        ← shown on the tile (any size; cropped to 16:10)
  roc-curve.png        ← referenced in the write-up as ![ROC curve](./roc-curve.png)
```

`index.md` starts with frontmatter:

```yaml
---
title: Customer Churn Prediction
summary: One sentence shown on the tile.
date: 2026-05-01            # tiles are sorted newest first
tags: [python, xgboost]
thumbnail: ./thumbnail.png  # optional
links:                      # optional, shown under the title
  - label: Code
    url: https://github.com/...
draft: false                # true hides it from the site
---
```

The body is ordinary Markdown: headings, tables, code blocks (syntax-highlighted), and
LaTeX math with `$inline$` and `$$display$$`. Images are resized and converted to WebP at
build time, so drop in full-resolution PNGs.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`.
In the GitHub repo, set Settings → Pages → Source to "GitHub Actions".
