import { formatTime, type GameDef } from "@rosterush/core";
import { LABELS, OG_HEIGHT, OG_WIDTH } from "./og/card";
import type { ShareItem } from "./share-core";

/**
 * 공유 페이지(/s/{shareId}) HTML에 넣을 미리보기 메타 태그.
 * 크롤러(카카오톡, 디스코드, X 등)는 JS를 실행하지 않으므로 HTML에 직접 들어 있어야 한다.
 */

export type ShareMeta = {
  lang: ShareItem["lang"];
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt: string;
};

export function shareMeta(share: ShareItem, game: GameDef, origin: string): ShareMeta {
  const t = LABELS[share.lang];
  const gameName = game.name[share.lang];
  const time = formatTime(share.totalMs);
  const title = `${gameName} · ${t.end[share.endReason]} ${time}`;
  const description = [
    share.percentile !== null ? `${t.top} ${share.percentile}%` : null,
    `${share.solved} / ${share.total}`,
    t.difficulty[share.difficulty],
    share.nickname ? t.by(share.nickname) : null,
    t.tagline,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    lang: share.lang,
    title,
    description,
    url: `${origin}/s/${share.shareId}`,
    image: `${origin}/og/${share.shareId}.png`,
    imageAlt: `${title} · ${share.solved} / ${share.total}`,
  };
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

export function metaTags(m: ShareMeta): string {
  const prop = (p: string, v: string | number) =>
    `<meta property="${p}" content="${esc(String(v))}"/>`;
  const name = (n: string, v: string) => `<meta name="${n}" content="${esc(v)}"/>`;
  return [
    `<title>${esc(m.title)} | Rosterush</title>`,
    name("description", m.description),
    prop("og:type", "website"),
    prop("og:site_name", "Rosterush"),
    prop("og:locale", { ko: "ko_KR", ja: "ja_JP", en: "en_US" }[m.lang]),
    prop("og:title", m.title),
    prop("og:description", m.description),
    prop("og:url", m.url),
    prop("og:image", m.image),
    prop("og:image:type", "image/png"),
    prop("og:image:width", OG_WIDTH),
    prop("og:image:height", OG_HEIGHT),
    prop("og:image:alt", m.imageAlt),
    name("twitter:card", "summary_large_image"),
    name("twitter:title", m.title),
    name("twitter:description", m.description),
    name("twitter:image", m.image),
    `<link rel="canonical" href="${esc(m.url)}"/>`,
  ].join("");
}

/**
 * 정적 export 껍데기 HTML의 기본 title·description·og·twitter·canonical·hreflang을 지우고 공유 기록용으로 바꾼다.
 * charset 메타 바로 뒤(없으면 <head> 바로 뒤)에 넣어 크롤러가 앞부분만 읽어도 보이게 한다.
 */
export function injectMeta(html: string, m: ShareMeta): string {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]*|twitter:[^"]*)"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    // 공유 기록은 기록 언어 하나뿐이라 언어별 대체 주소가 없다
    .replace(/<link\s+rel="alternate"[^>]*hreflang=[^>]*>/gi, "");
  const tags = metaTags(m);
  const charset = /<meta\s+charset=["']?[\w-]+["']?\s*\/?>/i.exec(cleaned);
  if (charset) {
    const at = charset.index + charset[0].length;
    return cleaned.slice(0, at) + tags + cleaned.slice(at);
  }
  const head = /<head[^>]*>/i.exec(cleaned);
  if (!head) throw new Error("share shell has no <head>");
  const at = head.index + head[0].length;
  return cleaned.slice(0, at) + tags + cleaned.slice(at);
}

/** 웹 껍데기가 아직 없을 때: 메타 태그만 담고 사람은 해당 게임 페이지로 보낸다 */
export function fallbackHtml(m: ShareMeta, redirectTo: string): string {
  const to = esc(redirectTo);
  return `<!doctype html><html lang="${m.lang}"><head><meta charset="utf-8"/>${metaTags(m)}<meta http-equiv="refresh" content="0;url=${to}"/></head><body><a href="${to}">${esc(m.title)}</a></body></html>`;
}
