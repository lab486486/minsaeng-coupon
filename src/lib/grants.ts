import { getCollection, type CollectionEntry } from 'astro:content';

export type GrantTier = 'high' | 'mid' | 'base' | 'low';
export type LocalGrant = CollectionEntry<'localGrants'>;

const HOMEPAGE_GRANT_LIMIT = 6;

/** "20만원", "최대 200만원" 등에서 만원 단위 숫자를 뽑습니다. */
export function parseAmountManwon(amount: string): number | null {
  const match = amount.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*만/);
  if (!match) return null;
  return Number(match[1]);
}

export function grantTierFromAmount(amount: string): GrantTier {
  const manwon = parseAmountManwon(amount);
  if (manwon == null) return 'low';
  if (manwon >= 100) return 'high';
  if (manwon >= 50) return 'mid';
  if (manwon >= 30) return 'base';
  return 'low';
}

/** 메인에 노출할 지자체 지원금 (정렬 후 최대 6개) */
export async function getHomepageGrants(): Promise<LocalGrant[]> {
  const all = await getCollection('localGrants', ({ data }) => !data.draft);
  return all.sort((a, b) => a.data.order - b.data.order).slice(0, HOMEPAGE_GRANT_LIMIT);
}
