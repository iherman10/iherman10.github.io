import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Each project is a folder: src/content/projects/<slug>/index.md, plus its thumbnail and figures.
const projects = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/projects',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      date: z.coerce.date(),
      authors: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      thumbnail: image().optional(),
      links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects };
