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
    cover_image: z.string().optional(),
    slug: z.string().optional(),
  }),
});

/** 검토·정리용 지역 지원금 안내 */
const regionalGrants = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/regional-grants' }),
  schema: z.object({
    title: z.string(),
    region: z.string(),
    amount: z.string(),
    target: z.string(),
    applyPeriod: z.string().default('공고 확인'),
    sourceName: z.string().default('뉴스·지자체 공고'),
    sourceUrl: z.string(),
    verifiedAt: z.string(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { posts, regionalGrants };
