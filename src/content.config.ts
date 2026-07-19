import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['총정리', '신청방법', '지역', '소득기준', 'FAQ', '기타']).default('총정리'),
    tags: z.array(z.string()).default([]),
    publishedAt: z.string(),
    updatedAt: z.string(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(99),
    updatedAt: z.string(),
  }),
});

export const collections = { posts, guides };
