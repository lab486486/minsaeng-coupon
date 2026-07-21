import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../lib/posts';

export const GET: APIRoute = async (context) => {
  const posts = await getPublishedPosts();
  const site = context.site ?? new URL('https://xn--lg3bwrn5a71ebza324d9pgtrf.kr');

  return rss({
    title: '민생쿠폰 블로그',
    description: '2026 민생회복 소비쿠폰·지원금 안내 글',
    site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.publishedAt || post.data.updatedAt),
      link: `/posts/${post.id}/`,
      categories: [post.data.category, ...(post.data.tags || [])],
    })),
    customData: `<language>ko-KR</language>`,
  });
};
