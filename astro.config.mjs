// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://xn--lg3bwrn5a71ebza324d9pgtrf.kr',
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
