import { LANGS, type Lang } from "@rosterush/core";
import type { Metadata } from "next";

/** 절대 URL(canonical, hreflang, og:url)의 기준. 배포 스크립트가 stage별로 넣는다. */
export const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "https://rosterush.junah.dev";

/** 검색엔진이 언어를 고르지 못할 때 보낼 기본 언어 */
const DEFAULT_LANG: Lang = "ko";

const OG_LOCALE = { ko: "ko_KR", ja: "ja_JP", en: "en_US" } satisfies Record<Lang, string>;

/**
 * 언어만 다르고 내용이 같은 페이지의 메타데이터.
 * @param path 언어 뒤 경로. `/`로 시작하고 끝난다 (예: `/`, `/genshin/`)
 */
export function localizedMeta(
  lang: Lang,
  path: string,
  { title, description }: { title: string; description: string },
): Metadata {
  const url = (l: Lang) => `/${l}${path}`;
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url(lang),
      languages: {
        ...Object.fromEntries(LANGS.map((l) => [l, url(l)])),
        "x-default": url(DEFAULT_LANG),
      },
    },
    openGraph: {
      type: "website",
      siteName: "Rosterush",
      locale: OG_LOCALE[lang],
      alternateLocale: LANGS.filter((l) => l !== lang).map((l) => OG_LOCALE[l]),
      title,
      description,
      url: url(lang),
    },
    twitter: { card: "summary", title, description },
  };
}
