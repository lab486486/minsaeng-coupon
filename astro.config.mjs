// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function tagStats() {
  return {
    name: 'tag-stats',
    hooks: {
      'astro:build:start': () => {
        execFileSync(process.execPath, [path.join(rootDir, 'scripts/generate-tag-stats.mjs')], {
          stdio: 'inherit',
        });
      },
    },
  };
}

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
    tagStats(),
  ],
});
