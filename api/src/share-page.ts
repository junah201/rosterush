import { getGame } from "@rosterush/games";
import { handler } from "./lib/http";
import { fallbackHtml, injectMeta, shareMeta } from "./lib/share-page";
import { getShareItem } from "./lib/share-read";
import { getSiteFile } from "./lib/site-read";

const html = (status: number, body: string, cacheControl: string) => ({
  statusCode: status,
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": cacheControl },
  body,
});

/**
 * GET /s/{shareId} — 공유 링크로 열리는 페이지.
 * 기록 언어의 웹 껍데기({lang}/s/index.html)에 미리보기 메타 태그(og:image = /og/{shareId}.png)를 넣어 돌려준다.
 * 페이지 내용(공유 기록)은 클라이언트가 주소의 shareId로 /api/shares/{shareId}를 불러 그린다.
 *
 * 캐시: 공유 내용은 바뀌지 않지만 껍데기는 웹 배포마다 바뀐다.
 * CloudFront는 s-maxage로 오래 두고(웹 배포 시 전체 무효화), 브라우저는 매번 재검증한다.
 */
export const main = handler(async (event) => {
  const shareId = event.pathParameters?.shareId ?? "";
  const share = await getShareItem(shareId);
  const game = share && getGame(share.game);
  if (!share || !game) {
    const shell = (await getSiteFile("404.html")) ?? "<!doctype html><title>Not found</title>";
    return html(404, shell, "public, max-age=0, s-maxage=60");
  }

  const meta = shareMeta(share, game, process.env.PUBLIC_ORIGIN ?? "");
  const shell = await getSiteFile(`${share.lang}/s/index.html`);
  if (!shell) {
    console.warn(`share shell missing: ${share.lang}/s/index.html`);
    return html(
      200,
      fallbackHtml(meta, `/${share.lang}/${share.game}/`),
      "public, max-age=0, s-maxage=300",
    );
  }
  return html(200, injectMeta(shell, meta), "public, max-age=0, s-maxage=31536000");
});
