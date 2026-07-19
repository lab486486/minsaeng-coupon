/**
 * 2026년용 초안 구간표 (근로소득 중심 추정).
 * 공식 통계가 확정되면 Decap/콘텐츠에서 수치를 갱신하세요.
 * 출처 참고: 국세청·통계청 분위 자료를 바탕으로 한 대략 구간.
 */
export type IncomeBracket = {
  label: string;
  /** 연소득 하한 (원, 이상) */
  min: number;
  /** 연소득 상한 (원, 미만) — Infinity 가능 */
  max: number;
  /** 대략 상위 몇 % 이내인지 (작을수록 고소득) */
  topPercent: number;
  note: string;
};

export const INCOME_BRACKETS_2026: IncomeBracket[] = [
  { label: '상위 1%', min: 200_000_000, max: Infinity, topPercent: 1, note: '매우 고소득 구간(추정)' },
  { label: '상위 5%', min: 120_000_000, max: 200_000_000, topPercent: 5, note: '고소득 구간(추정)' },
  { label: '상위 10%', min: 90_000_000, max: 120_000_000, topPercent: 10, note: '상위 10% 근처(추정)' },
  { label: '상위 20%', min: 70_000_000, max: 90_000_000, topPercent: 20, note: '상위 20% 근처(추정)' },
  { label: '상위 30%', min: 55_000_000, max: 70_000_000, topPercent: 30, note: '중상위 구간(추정)' },
  { label: '중위권', min: 35_000_000, max: 55_000_000, topPercent: 50, note: '중위소득 근처(추정)' },
  { label: '하위 40%', min: 25_000_000, max: 35_000_000, topPercent: 60, note: '중하위 구간(추정)' },
  { label: '하위 30%', min: 18_000_000, max: 25_000_000, topPercent: 70, note: '하위권에 가까움(추정)' },
  { label: '하위 20%', min: 12_000_000, max: 18_000_000, topPercent: 80, note: '하위 20%대(추정)' },
  { label: '하위 10%', min: 0, max: 12_000_000, topPercent: 90, note: '하위 소득 구간(추정)' },
];

export function findBracket(annualIncome: number): IncomeBracket | null {
  if (!Number.isFinite(annualIncome) || annualIncome < 0) return null;
  return (
    INCOME_BRACKETS_2026.find((b) => annualIncome >= b.min && annualIncome < b.max) ??
    INCOME_BRACKETS_2026[INCOME_BRACKETS_2026.length - 1]
  );
}

export function formatWon(value: number) {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value));
}
