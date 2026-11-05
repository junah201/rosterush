/**
 * 공유 미리보기 이미지 샘플을 PNG로 렌더링 → api/.local/og/
 *   pnpm --filter @rosterush/api og:preview
 * Google Fonts에서 글꼴 서브셋을 받으므로 인터넷 연결이 필요하다.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { getGame } from "@rosterush/games";
import type { CardInput } from "../src/lib/og/card";
import { renderCardPng } from "../src/lib/og/render";

const require = createRequire(import.meta.url);
const wasm = async () =>
  new Uint8Array(await readFile(require.resolve("@resvg/resvg-wasm/index_bg.wasm")));

const name = (id: string, lang: CardInput["lang"]) => getGame(id)?.name[lang] ?? id;

const samples: Record<string, CardInput> = {
  "ko-clear-ranked": {
    lang: "ko",
    gameName: name("genshin", "ko"),
    difficulty: "normal",
    endReason: "clear",
    totalMs: 222_170,
    solved: 123,
    total: 123,
    percentile: 3,
    nickname: "토끼발",
  },
  "ja-clear-unranked": {
    lang: "ja",
    gameName: name("starrail", "ja"),
    difficulty: "hard",
    endReason: "clear",
    totalMs: 498_030,
    solved: 88,
    total: 88,
    percentile: null,
    nickname: "うさぎ",
  },
  "en-timeout": {
    lang: "en",
    gameName: name("overwatch", "en"),
    difficulty: "normal",
    endReason: "timeout",
    totalMs: 600_000,
    solved: 38,
    total: 54,
    percentile: null,
    nickname: null,
  },
  "ko-giveup-long-percentile": {
    lang: "ko",
    gameName: name("starrail", "ko"),
    difficulty: "easy",
    endReason: "clear",
    totalMs: 157_430,
    solved: 88,
    total: 88,
    percentile: 12.3,
    nickname: "原神マスター",
  },
};

const out = join(import.meta.dirname, "../.local/og");
await mkdir(out, { recursive: true });
for (const [file, input] of Object.entries(samples)) {
  const started = performance.now();
  const png = await renderCardPng(input, wasm);
  await writeFile(join(out, `${file}.png`), png);
  console.log(
    `${file}.png  ${(png.length / 1024).toFixed(0)} KB  ${(performance.now() - started).toFixed(0)} ms`,
  );
}
