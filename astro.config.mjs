// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://minsaeng-coupon.pages.dev',
  output: 'static',
  build: {
    format: 'directory',
    assets: 'assets',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
});
