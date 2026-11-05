import { getGame } from "@rosterush/games";
import { describe, expect, it } from "vitest";
import type { ShareItem } from "./lib/share-core";
import { fallbackHtml, injectMeta, shareMeta } from "./lib/share-page";

const game = getGame("genshin");
if (!game) throw new Error("genshin missing");

const share: ShareItem = {
  shareId: "Ab3dE6gH",
  resultId: "secret",
  game: "genshin",
  lang: "ko",
  difficulty: "normal",
  rosterVer: 1,
  endReason: "clear",
  totalMs: 222_170,
  solved: 123,
  total: 123,
  solves: {},
  percentile: 3,
  aggVersion: "2026-11-05",
  nickname: '<b>"토끼"</b>',
  createdAt: 0,
};

// Next.js 정적 export가 만드는 head와 비슷한 껍데기
const shell = `<!DOCTYPE html><html lang="ko"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width"/><title>Rosterush</title><meta name="description" content="게임 캐릭터 이름을 전부 맞히는 타이핑 퀴즈"/><meta property="og:title" content="old"/><script src="/_next/a.js"></script></head><body><div id="app"></div></body></html>`;

describe("share page meta", () => {
  const meta = shareMeta(share, game, "https://rosterush.junah.dev");

  it("points og:image at the share's PNG", () => {
    expect(meta.image).toBe("https://rosterush.junah.dev/og/Ab3dE6gH.png");
    expect(meta.url).toBe("https://rosterush.junah.dev/s/Ab3dE6gH");
    expect(meta.title).toBe("원신 · 올 클리어! 03:42.17");
    expect(meta.description).toContain("상위 3%");
    expect(meta.description).toContain("123 / 123");
  });

  it("replaces the shell's default tags and keeps the rest", () => {
    const out = injectMeta(shell, meta);
    expect(out.match(/<title>/g)).toHaveLength(1);
    expect(out).toContain("<title>원신 · 올 클리어! 03:42.17 | Rosterush</title>");
    expect(out).not.toContain('content="old"');
    expect(out).not.toContain("타이핑 퀴즈");
    expect(out.match(/name="description"/g)).toHaveLength(1);
    expect(out).toContain(
      '<meta property="og:image" content="https://rosterush.junah.dev/og/Ab3dE6gH.png"/>',
    );
    expect(out).toContain('<meta name="twitter:card" content="summary_large_image"/>');
    expect(out).toContain('<script src="/_next/a.js"></script>');
    expect(out).toContain('<div id="app"></div>');
    // charset 바로 뒤에 들어간다
    expect(out.indexOf("<title>")).toBeGreaterThan(out.indexOf('charSet="utf-8"'));
    expect(out.indexOf("<title>")).toBeLessThan(out.indexOf('name="viewport"'));
  });

  it("escapes the nickname", () => {
    const out = injectMeta(shell, meta);
    expect(out).not.toContain("<b>");
    expect(out).toContain("&lt;b&gt;&quot;토끼&quot;&lt;/b&gt;");
  });

  it("never leaks the resultId", () => {
    expect(injectMeta(shell, meta)).not.toContain("secret");
  });

  it("builds a fallback page that redirects people to the game", () => {
    const out = fallbackHtml(meta, "/ko/genshin/");
    expect(out).toContain('<meta http-equiv="refresh" content="0;url=/ko/genshin/"/>');
    expect(out).toContain('property="og:image"');
  });
});
