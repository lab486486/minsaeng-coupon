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

설정 위치:

- `GITHUB_CLIENT_ID` → `wrangler.toml`의 `[vars]` (공개값, 배포 시 Functions에 바인딩)
- `GITHUB_CLIENT_SECRET` → Cloudflare Pages → Settings → Variables and Secrets (**Secret**만)

`GITHUB_CLIENT_ID`를 Secret으로 넣으면 `[vars]`와 이름이 충돌하고, Secret만 넣으면 Functions에서 비어 보일 수 있습니다.

## Decap

`/admin` → GitHub 로그인 후 `src/content/posts`, `src/content/guides` 수정.

## 소득구간

`/income` — 연소득 입력 시 2026 추정 분위 구간을 보여줍니다. 수치는 초안이므로 공식 통계로 교체하세요.

## 뉴스 자동 수집

매일 **한국시간 09:00** GitHub Actions가 Google 뉴스 RSS를 읽어 `data/news-watch.json`을 갱신합니다.

```bash
npm run news:fetch
```

- 페이지: `/news`
- 본문 크롤링 없음 (제목·출처·링크만)
- 수동 실행: Actions → **Daily news watch** → Run workflow
