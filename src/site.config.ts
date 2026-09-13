/**
 * Site brand / SEO config.
 * Google에 도메인 대신 노출할 브랜드명과 alternateName.
 */
export const site = {
  /** Google / OG에 노출할 사이트 브랜드명 (도메인 대신) */
  brandName: '민생회복지원금',
  tagline: '민생회복 소비쿠폰 안내',
  description: '2026 민생회복 소비쿠폰·지원금 신청 안내 (비공식)',
  alternateNames: [
    '민생회복 소비쿠폰',
    'Minsaeng Coupon',
    '민생회복소비쿠폰.kr',
  ] as const,
  baseUrl: 'https://xn--lg3bwrn5a71ebza324d9pgtrf.kr',
  lang: 'ko',
} as const;

export type SiteConfig = typeof site;
