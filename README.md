# 민생쿠폰 (minsaeng-coupon)

2026 민생회복 소비쿠폰·지원금 비공식 안내 사이트 초안입니다.

- **스택**: Astro 7 + Cloudflare Pages + Decap CMS + GitHub OAuth
- **도메인(예정)**: 민생회복소비쿠폰.kr
- **Pages 프로젝트명**: `minsaeng-coupon`

## 로컬

```bash
npm install
cp .dev.vars.example .dev.vars   # Client Secret 입력
npm run dev                      # 정적 페이지만
npm run pages:dev                # OAuth/R2 Functions 포함
```

## GitHub OAuth 콜백 (필수)

GitHub → Settings → Developer settings → OAuth Apps

- Homepage URL: `https://minsaeng-coupon.pages.dev`
- Authorization callback URL:
  - `https://minsaeng-coupon.pages.dev/api/callback`
  - (도메인 연결 후) `https://민생회복소비쿠폰.kr/api/callback`
  - 로컬: `http://localhost:8788/api/callback`

**Client ID + Client Secret 둘 다** 필요합니다. ID만으로는 로그인 완료가 안 됩니다.

Cloudflare Pages → Settings → Environment variables:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## Decap

`/admin` → GitHub 로그인 후 `src/content/posts`, `src/content/guides` 수정.

## 소득구간

`/income` — 연소득 입력 시 2026 추정 분위 구간을 보여줍니다. 수치는 초안이므로 공식 통계로 교체하세요.
