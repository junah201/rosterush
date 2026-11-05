import type { Lang } from "@rosterush/core";
import type { Font } from "satori";
import { DISPLAY_FONT } from "./card";

/**
 * 이미지에 실제로 그리는 글자만 담은 글꼴을 Google Fonts에서 받는다.
 * css2 API의 text= 파라미터를 쓰면 그 글자만 들어 있는 TTF가 온다 (한중일 글꼴도 수 KB).
 * satori는 woff2를 못 읽으므로 브라우저가 아닌 User-Agent로 요청해 TTF를 받는다.
 */

const CSS_URL = "https://fonts.googleapis.com/css2";
const TIMEOUT_MS = 4000;
const MAX_CACHE = 300;

/** Lambda 인스턴스 안에서 같은 글자 조합을 다시 받지 않도록 캐시 (실패한 요청은 지움) */
const cache = new Map<string, Promise<Font[]>>();

/** 글자를 중복 없이 정렬해 캐시 키와 요청을 안정시킨다. 공백·제어문자는 글꼴이 필요 없어 뺀다 */
export function uniqueChars(text: string): string {
  return [...new Set(Array.from(text))]
    .filter((c) => c.trim() !== "" && !/\p{Cc}/u.test(c))
    .sort()
    .join("");
}

/** 가나·한자가 있으면 일본어 글꼴이 필요하다 */
export const hasJapanese = (text: string) =>
  /[\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Han}]/u.test(text);

async function fetchFamily(family: string, weights: number[], text: string): Promise<Font[]> {
  const url = `${CSS_URL}?family=${encodeURIComponent(family)}:wght@${weights.join(";")}&text=${encodeURIComponent(text)}`;
  const css = await (await get(url)).text();

  const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1] ?? "");
  const fonts = await Promise.all(
    faces.map(async (face) => {
      const src = face.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
      const weight = Number(face.match(/font-weight:\s*(\d+)/)?.[1] ?? 400);
      if (!src) throw new Error(`no ttf source for ${family}`);
      const data = await (await get(src)).arrayBuffer();
      return { name: family, data, weight: weight as Font["weight"], style: "normal" as const };
    }),
  );
  if (!fonts.length) throw new Error(`no font faces for ${family}`);
  return fonts;
}

async function get(url: string): Promise<Response> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`font fetch ${res.status}: ${url.slice(0, 120)}`);
  return res;
}

function cached(family: string, weights: number[], text: string): Promise<Font[]> {
  const key = `${family}|${weights.join(",")}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size >= MAX_CACHE) cache.clear();
  const p = fetchFamily(family, weights, text).catch((e) => {
    cache.delete(key);
    throw e;
  });
  cache.set(key, p);
  return p;
}

export const BODY_KR = "Noto Sans KR";
export const BODY_JP = "Noto Sans JP";

/**
 * 카드에 필요한 글꼴.
 * - 디스플레이(Dela Gothic One): 로고·기록·배지 숫자
 * - 본문: Noto Sans KR이 한글·라틴·가나 일부를 덮고, 가나·한자가 있으면 Noto Sans JP를 더한다.
 *   ja 카드는 일본식 한자 모양을 위해 JP를 앞에 둔다.
 */
export async function loadCardFonts(
  lang: Lang,
  displayText: string,
  bodyText: string,
): Promise<{ fonts: Font[]; bodyFamily: string }> {
  const display = uniqueChars(displayText);
  const body = uniqueChars(bodyText);
  const needJp = lang === "ja" || hasJapanese(body);

  const [displayFonts, kr, jp] = await Promise.all([
    cached(DISPLAY_FONT, [400], display),
    cached(BODY_KR, [700, 900], body),
    needJp ? cached(BODY_JP, [700, 900], body) : Promise.resolve([]),
  ]);

  const order = lang === "ja" ? [...jp, ...kr] : [...kr, ...jp];
  const families = [...new Set(order.map((f) => f.name))];
  return {
    fonts: [...order, ...displayFonts],
    bodyFamily: families.map((f) => `"${f}"`).join(", "),
  };
}
