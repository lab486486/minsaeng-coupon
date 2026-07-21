import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedPosts } from '../lib/posts';

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://xn--lg3bwrn5a71ebza324d9pgtrf.kr'))
    .toString()
    .replace(/\/$/, '');
  const posts = await getPublishedPosts();
  const guides = await getCollection('guides');

  const staticPaths = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/posts/', changefreq: 'daily', priority: '0.9' },
    { loc: '/news/', changefreq: 'daily', priority: '0.9' },
    { loc: '/income/', changefreq: 'weekly', priority: '0.7' },
    { loc: '/guides/checklist/', changefreq: 'monthly', priority: '0.6' },
    { loc: '/rss.xml', changefreq: 'daily', priority: '0.5' },
  ];

  const urls = [
    ...staticPaths,
    ...posts.map((post) => ({
      loc: `/posts/${post.id}/`,
      lastmod: post.data.updatedAt || post.data.publishedAt,
      changefreq: 'weekly',
      priority: '0.8',
    })),
    ...guides.map((guide) => ({
      loc: `/guides/${guide.id}/`,
      lastmod: guide.data.updatedAt,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((item) => {
    const loc = xmlEscape(`${base}${item.loc}`);
    const lastmod =
      'lastmod' in item && item.lastmod ? `\n    <lastmod>${xmlEscape(item.lastmod)}</lastmod>` : '';
    return `  <url>
    <loc>${loc}</loc>${lastmod}
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
