import type { Env } from '../types';

/** CMS를 여는 도메인(opener) — OAuth 팝업(pages.dev)과 달라도 핸드셰이크 되어야 함 */
const ALLOWED_ORIGINS = [
  'https://minsaeng-coupon.pages.dev',
  'https://xn--lg3bwrn5a71ebza324d9pgtrf.kr',
  'https://www.xn--lg3bwrn5a71ebza324d9pgtrf.kr',
  'https://민생회복소비쿠폰.kr',
  'https://www.민생회복소비쿠폰.kr',
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const clientId = context.env.GITHUB_CLIENT_ID;
  const clientSecret = context.env.GITHUB_CLIENT_SECRET;

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }
  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth env vars missing', { status: 500 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenJson.access_token) {
    return new Response(
      `OAuth failed: ${tokenJson.error_description || tokenJson.error || 'unknown'}`,
      { status: 400 },
    );
  }

  const successMessage =
    'authorization:github:success:' +
    JSON.stringify({ token: tokenJson.access_token, provider: 'github' });

  const content = `<!doctype html>
<html lang="ko">
  <head><meta charset="utf-8" /><title>로그인 완료</title></head>
  <body>
    <script>
      (function () {
        var allowed = ${JSON.stringify(ALLOWED_ORIGINS)};
        var success = ${JSON.stringify(successMessage)};

        function receiveMessage(event) {
          if (allowed.indexOf(event.origin) === -1) return;
          if (!window.opener) return;
          window.opener.postMessage(success, event.origin);
          window.removeEventListener('message', receiveMessage, false);
          try { window.close(); } catch (e) {}
        }

        window.addEventListener('message', receiveMessage, false);
        if (window.opener) {
          window.opener.postMessage('authorizing:github', '*');
        } else {
          document.body.insertAdjacentHTML(
            'beforeend',
            '<p>팝업이 차단되었거나 opener가 없습니다. CMS 탭에서 다시 로그인해 주세요.</p>'
          );
        }
      })();
    </script>
    <p>GitHub 로그인 완료. CMS 화면으로 돌아가는 중…</p>
  </body>
</html>`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
