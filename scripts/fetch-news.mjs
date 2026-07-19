#!/usr/bin/env node
/**
 * Google 뉴스 RSS로 민생지원금·소비쿠폰 관련 기사를 수집합니다.
 * - 기사 본문은 크롤링하지 않고 제목/링크/출처/일시만 저장
 * - data/news-watch.json 에 누적 (중복 URL/제목 제외)
 *
 * Usage: node scripts/fetch-news.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'data/news-watch.json');

const FEEDS = [
  {
    id: 'minsaeng',
    label: '민생지원금',
    url: 'https://news.google.com/rss/search?q=%EB%AF%BC%EC%83%9D%EC%A7%80%EC%9B%90%EA%B8%88&hl=ko&gl=KR&ceid=KR:ko',
  },
  {
    id: 'recovery',
    label: '민생회복지원금/소비쿠폰',
    url: 'https://news.google.com/rss/search?q=%EB%AF%BC%EC%83%9D%ED%9A%8C%EB%B3%B5%EC%A7%80%EC%9B%90%EA%B8%88%20OR%20%EB%AF%BC%EC%83%9D%ED%9A%8C%EB%B3%B5%20%EC%86%8C%EB%B9%84%EC%BF%A0%ED%8F%B0&hl=ko&gl=KR&ceid=KR:ko',
  },
];

const MAX_ITEMS = 120;

function decodeXml(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseItems(xml) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of blocks) {
    const title = decodeXml((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
    const link = decodeXml((block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '').trim();
    const pubDate = decodeXml((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '').trim();
    if (!title || !link) continue;
    // "제목 - 언론사" 형태에서 출처 분리
    const dash = title.lastIndexOf(' - ');
    const source = dash > 0 ? title.slice(dash + 3).trim() : '';
    const headline = dash > 0 ? title.slice(0, dash).trim() : title;
    items.push({
      title: headline,
      source,
      link,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
    });
  }
  return items;
}

async function loadExisting() {
  try {
    const raw = await fs.readFile(OUT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { updatedAt: null, items: [] };
  }
}

async function main() {
  const existing = await loadExisting();
  const seen = new Set(existing.items.map((i) => `${i.title}::${i.source}`));
  const collected = [];

  for (const feed of FEEDS) {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'minsaeng-coupon-news-watch/1.0' },
    });
    if (!res.ok) {
      console.warn(`[warn] feed ${feed.id} HTTP ${res.status}`);
      continue;
    }
    const xml = await res.text();
    for (const item of parseItems(xml)) {
      const key = `${item.title}::${item.source}`;
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push({
        ...item,
        query: feed.label,
        foundAt: new Date().toISOString(),
      });
    }
  }

  const merged = [...collected, ...existing.items]
    .sort((a, b) => String(b.publishedAt || b.foundAt).localeCompare(String(a.publishedAt || a.foundAt)))
    .slice(0, MAX_ITEMS);

  const payload = {
    updatedAt: new Date().toISOString(),
    source: 'Google News RSS',
    note: '기사 본문은 수집하지 않습니다. 링크는 Google News 경유 URL일 수 있습니다.',
    newCount: collected.length,
    items: merged,
  };

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`news-watch: +${collected.length} new, total ${merged.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
