import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../lib/posts';
import { site as siteConfig } from '../site.config';

export const GET: APIRoute = async (context) => {
  const posts = await getPublishedPosts();
  const site = context.site ?? new URL(siteConfig.baseUrl);

  return rss({
    title: `${siteConfig.brandName} 블로그`,
    description: siteConfig.description,
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
