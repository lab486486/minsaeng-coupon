#!/usr/bin/env node
/**
 * news-watch.json 제목에서 지역·금액을 규칙으로 뽑아
 * src/content/regional-grants/*.md 초안(draft: true)을 생성합니다.
 * AI 없음. 사람이 Decap에서 검토 후 게시.
 *
 * Usage:
 *   node scripts/draft-regional-from-news.mjs
 *   node scripts/draft-regional-from-news.mjs --dry-run
 *   node scripts/draft-regional-from-news.mjs --max=5
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NEWS_FILE = path.join(ROOT, 'data/news-watch.json');
const STATE_FILE = path.join(ROOT, 'data/news-draft-state.json');
const OUT_DIR = path.join(ROOT, 'src/content/regional-grants');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const maxArg = [...args].find((a) => a.startsWith('--max='));
const MAX_NEW = Math.max(1, Number(maxArg?.split('=')[1] || 5));

/** 짧은 지명 → 정식명 + ascii slug */
const REGION_ALIASES = [
  ['서울특별시', '서울특별시', 'seoul'],
  ['부산광역시', '부산광역시', 'busan'],
  ['대구광역시', '대구광역시', 'daegu'],
  ['인천광역시', '인천광역시', 'incheon'],
  ['광주광역시', '광주광역시', 'gwangju'],
  ['대전광역시', '대전광역시', 'daejeon'],
  ['울산광역시', '울산광역시', 'ulsan'],
  ['세종특별자치시', '세종특별자치시', 'sejong'],
  ['제주특별자치도', '제주특별자치도', 'jeju'],
  ['속초시', '속초시', 'sokcho'],
  ['속초', '속초시', 'sokcho'],
  ['의령군', '의령군', 'uiryeong'],
  ['의령', '의령군', 'uiryeong'],
  ['통영시', '통영시', 'tongyeong'],
  ['통영', '통영시', 'tongyeong'],
  ['부안군', '부안군', 'buan'],
  ['부안', '부안군', 'buan'],
  ['완주군', '완주군', 'wanju'],
  ['완주', '완주군', 'wanju'],
  ['고창군', '고창군', 'gochang'],
  ['고창', '고창군', 'gochang'],
  ['하동군', '하동군', 'hadong'],
  ['하동', '하동군', 'hadong'],
  ['당진시', '당진시', 'dangjin'],
  ['당진', '당진시', 'dangjin'],
  ['강릉시', '강릉시', 'gangneung'],
  ['강릉', '강릉시', 'gangneung'],
  ['김해시', '김해시', 'gimhae'],
  ['김해', '김해시', 'gimhae'],
  ['나주시', '나주시', 'naju'],
  ['나주', '나주시', 'naju'],
  ['의성군', '의성군', 'uiseong'],
  ['의성', '의성군', 'uiseong'],
  ['여수시', '여수시', 'yeosu'],
  ['여수', '여수시', 'yeosu'],
  ['순천시', '순천시', 'suncheon'],
  ['순천', '순천시', 'suncheon'],
  ['목포시', '목포시', 'mokpo'],
  ['목포', '목포시', 'mokpo'],
  ['전주시', '전주시', 'jeonju'],
  ['전주', '전주시', 'jeonju'],
  ['청주시', '청주시', 'cheongju'],
  ['청주', '청주시', 'cheongju'],
  ['천안시', '천안시', 'cheonan'],
  ['천안', '천안시', 'cheonan'],
  ['창원시', '창원시', 'changwon'],
  ['창원', '창원시', 'changwon'],
  ['포항시', '포항시', 'pohang'],
  ['포항', '포항시', 'pohang'],
  ['구미시', '구미시', 'gumi'],
  ['구미', '구미시', 'gumi'],
  ['춘천시', '춘천시', 'chuncheon'],
  ['춘천', '춘천시', 'chuncheon'],
  ['원주시', '원주시', 'wonju'],
  ['원주', '원주시', 'wonju'],
  ['제주시', '제주시', 'jejusi'],
  ['서귀포시', '서귀포시', 'seogwipo'],
  ['서귀포', '서귀포시', 'seogwipo'],
];

const SKIP_TITLE =
  /우리\s*지역도|지급\s*대상은\?|누가\s*받을|전국|4차\s*민생|추석\s*민생지원금’?\s*최대|브리핑|폐업|신기록/;

function todayKstDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function yearKst() {
  return todayKstDate().slice(0, 4);
}

function extractAmount(title) {
  // 1인·주민 지원 규모(만원). 예산(억)은 제외.
  const patterns = [
    /(?:1인(?:당)?|인당|최대)?\s*(\d+(?:\.\d+)?)\s*만\s*원/,
    /(\d+(?:\.\d+)?)\s*만원/,
  ];
  for (const re of patterns) {
    const m = title.match(re);
    if (!m) continue;
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n < 5 || n > 300) continue; // 비정상 규모 스킵
    return `${Number.isInteger(n) ? n : m[1]}만원`;
  }
  return null;
}

function extractTarget(title) {
  if (/전\s*시민/.test(title)) return '전 시민(보도 기준)';
  if (/전\s*군민/.test(title)) return '전 군민(보도 기준)';
  if (/전\s*도민/.test(title)) return '전 도민(보도 기준)';
  if (/전\s*구민/.test(title)) return '전 구민(보도 기준)';
  if (/전\s*주민/.test(title)) return '전 주민(보도 기준)';
  return '공고 확인';
}

function extractRegion(title) {
  // 긴 alias 우선
  const sorted = [...REGION_ALIASES].sort((a, b) => b[0].length - a[0].length);
  for (const [alias, region, slug] of sorted) {
    if (title.includes(alias)) return { region, slugBase: slug };
  }

  const m = title.match(
    /([가-힣]{1,10}(?:특별자치시|특별자치도|광역시|특별시|시|군|구))/,
  );
  if (!m) return null;
  const region = m[1];
  const slugBase =
    'r' +
    crypto.createHash('sha1').update(region).digest('hex').slice(0, 6);
  return { region, slugBase };
}

function parseNewsItem(item) {
  const title = String(item.title || '').trim();
  if (!title || SKIP_TITLE.test(title)) return null;

  const regionInfo = extractRegion(title);
  const amount = extractAmount(title);
  if (!regionInfo || !amount) return null;

  // 한 제목에 시·군이 여러 개면(비교 기사) 스킵 — 오탐 방지
  const regionHits = (title.match(/[가-힣]{1,10}(?:시|군|구)/g) || []).length;
  if (regionHits >= 3) return null;

  return {
    title,
    region: regionInfo.region,
    slugBase: regionInfo.slugBase,
    amount,
    target: extractTarget(title),
    sourceName: item.source || '뉴스 보도',
    sourceUrl: item.link,
    publishedAt: item.publishedAt || null,
  };
}

function yamlQuote(value) {
  const s = String(value ?? '');
  return JSON.stringify(s);
}

function buildMarkdown(parsed, verifiedAt) {
  const { region, amount, target, sourceName, sourceUrl, title } = parsed;
  const pageTitle = `${region} 민생지원금 ${amount} 안내`;
  const body = `## 한줄 요약

${title}

**보도 기준 ${region} ${amount}** 관련 소식입니다.  
실제 자격·금액·일정은 **${region} 공식 공고**를 기준으로 확인하세요.

## 지원 내용(보도 기준)

- 지역: ${region}
- 금액: ${amount}
- 대상: ${target}

## 신청·확인

1. ${region} 홈페이지·읍면동 공고 확인
2. 신청 기간·지급 수단 확인
3. 사용처·기한 확인

## 참고

- 출처: ${sourceName}
- 이 페이지는 뉴스 제목 기반 **자동 초안**입니다. 검토 후 게시하세요.
`;

  const fm = [
    '---',
    `title: ${yamlQuote(pageTitle)}`,
    `region: ${yamlQuote(region)}`,
    `amount: ${yamlQuote(amount)}`,
    `target: ${yamlQuote(target)}`,
    'applyPeriod: "공고·신청 일정 확인"',
    `sourceName: ${yamlQuote(sourceName)}`,
    `sourceUrl: ${yamlQuote(sourceUrl)}`,
    `verifiedAt: "${verifiedAt}"`,
    'draft: true',
    '---',
    '',
    body,
  ].join('\n');

  return { pageTitle, markdown: fm };
}

async function loadJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function listExistingGrants() {
  const files = await fs.readdir(OUT_DIR).catch(() => []);
  const byRegionAmount = new Set();
  const slugs = new Set();
  const sourceUrls = new Set();

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    slugs.add(file.replace(/\.md$/, ''));
    const raw = await fs.readFile(path.join(OUT_DIR, file), 'utf8');
    const region = (raw.match(/^region:\s*(.+)$/m) || [])[1]?.trim();
    const amount = (raw.match(/^amount:\s*(.+)$/m) || [])[1]?.trim();
    const sourceUrl = (raw.match(/^sourceUrl:\s*(.+)$/m) || [])[1]?.trim();
    if (region && amount) byRegionAmount.add(`${region}::${amount}`);
    if (sourceUrl) sourceUrls.add(sourceUrl);
  }
  return { byRegionAmount, slugs, sourceUrls };
}

function uniqueSlug(slugBase, year, used) {
  let slug = `${slugBase}-${year}`;
  if (!used.has(slug)) return slug;
  for (let i = 2; i < 50; i++) {
    slug = `${slugBase}-${year}-${i}`;
    if (!used.has(slug)) return slug;
  }
  return `${slugBase}-${year}-${crypto.randomBytes(2).toString('hex')}`;
}

async function main() {
  const news = await loadJson(NEWS_FILE, { items: [] });
  const state = await loadJson(STATE_FILE, { processedLinks: [], updatedAt: null });
  const processed = new Set(state.processedLinks || []);
  const existing = await listExistingGrants();
  const verifiedAt = todayKstDate();
  const year = yearKst();

  const created = [];
  const candidates = [];
  const queuedRegionAmount = new Set(existing.byRegionAmount);

  for (const item of news.items || []) {
    if (!item.link || processed.has(item.link)) continue;
    processed.add(item.link);
    if (existing.sourceUrls.has(item.link)) continue;

    const parsed = parseNewsItem(item);
    if (!parsed) continue;
    const raKey = `${parsed.region}::${parsed.amount}`;
    if (queuedRegionAmount.has(raKey)) continue;
    queuedRegionAmount.add(raKey);
    candidates.push(parsed);
  }

  for (const parsed of candidates.slice(0, MAX_NEW)) {
    const slug = uniqueSlug(parsed.slugBase, year, existing.slugs);
    existing.slugs.add(slug);
    existing.byRegionAmount.add(`${parsed.region}::${parsed.amount}`);
    const { markdown, pageTitle } = buildMarkdown(parsed, verifiedAt);
    const filePath = path.join(OUT_DIR, `${slug}.md`);

    if (!DRY_RUN) {
      await fs.mkdir(OUT_DIR, { recursive: true });
      await fs.writeFile(filePath, markdown, 'utf8');
    }
    processed.add(parsed.sourceUrl);
    created.push({ slug, pageTitle, region: parsed.region, amount: parsed.amount });
    console.log(`${DRY_RUN ? '[dry-run] ' : '+'} ${slug}.md — ${parsed.region} ${parsed.amount}`);
  }

  // 상태 파일은 최근 800개만 유지
  const nextLinks = [...processed].slice(-800);
  if (!DRY_RUN) {
    await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
    await fs.writeFile(
      STATE_FILE,
      `${JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          processedLinks: nextLinks,
          lastCreated: created,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
  }

  console.log(
    `draft-regional: ${created.length} created (candidates ${candidates.length}, max ${MAX_NEW})${DRY_RUN ? ' [dry-run]' : ''}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
