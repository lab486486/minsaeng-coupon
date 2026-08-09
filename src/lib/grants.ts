export type GrantTier = 'high' | 'mid' | 'base' | 'low';

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
