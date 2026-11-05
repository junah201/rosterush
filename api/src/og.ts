// esbuild binary 로더로 번들됨 (api/esbuild.config.js)
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import { getGame } from "@rosterush/games";
import { HttpError, handler } from "./lib/http";
import { renderCardPng } from "./lib/og/render";
import { getShareItem } from "./lib/share-read";

const FILE_RE = /^([0-9A-Za-z]{8})\.png$/;

/**
 * GET /og/{shareId}.png — 공유 링크 미리보기 이미지 (1200×630 PNG).
 * 공유 내용은 바뀌지 않으므로 CloudFront에 1년 캐시한다.
 */
export const main = handler(async (event) => {
  const shareId = FILE_RE.exec(event.pathParameters?.file ?? "")?.[1];
  if (!shareId) throw new HttpError("SHARE_NOT_FOUND", "share not found");

  const share = await getShareItem(shareId);
  const game = share && getGame(share.game);
  if (!share || !game) throw new HttpError("SHARE_NOT_FOUND", "share not found");

  const png = await renderCardPng(
    {
      lang: share.lang,
      gameName: game.name[share.lang],
      difficulty: share.difficulty,
      endReason: share.endReason,
      totalMs: share.totalMs,
      solved: share.solved,
      total: share.total,
      percentile: share.percentile,
      nickname: share.nickname ?? null,
    },
    () => resvgWasm,
  );

  return {
    statusCode: 200,
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
    body: Buffer.from(png).toString("base64"),
    isBase64Encoded: true,
  };
});
