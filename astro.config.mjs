// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://iherman10.github.io',
  devToolbar: { enabled: false },
  // URLs from the old al-folio site, kept alive so existing links don't 404.
  redirects: {
    '/projects/air_quality_geo_experiments': '/projects/aqi-geo-experiments/',
    '/projects': '/',
    '/cv': '/',
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    // Code blocks get both palettes; global.css picks one based on the theme.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      defaultColor: false,
    },
  },
});
