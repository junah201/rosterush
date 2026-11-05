import { describe, expect, it } from "vitest";
import { buildCard, type CardInput, formatTime } from "./lib/og/card";
import { hasJapanese, uniqueChars } from "./lib/og/fonts";

const base: CardInput = {
  lang: "ko",
  gameName: "원신",
  difficulty: "normal",
  endReason: "clear",
  totalMs: 222_170,
  solved: 123,
  total: 123,
  percentile: 3,
  nickname: "토끼발",
};

const texts = (n: unknown): string[] => {
  if (typeof n === "string") return [n];
  if (Array.isArray(n)) return n.flatMap(texts);
  if (n && typeof n === "object" && "props" in n)
    return texts((n as { props: { children?: unknown } }).props.children);
  return [];
};

describe("og card", () => {
  it("formats time like the result screen", () => {
    expect(formatTime(222_170)).toBe("03:42.17");
    expect(formatTime(600_000)).toBe("10:00.00");
  });

  it("shows the percentile badge when ranked", () => {
    const all = texts(buildCard(base).node);
    expect(all).toContain("상위");
    expect(all).toContain("3%");
    expect(all).toContain("토끼발의 기록");
  });

  it("falls back to the collected rate without a percentile", () => {
    const all = texts(
      buildCard({ ...base, endReason: "timeout", solved: 38, total: 54, percentile: null }).node,
    );
    expect(all).toContain("수집률");
    expect(all).toContain("70%");
    expect(all).toContain("시간 초과");
  });

  it("omits the nickname line when there is none", () => {
    const all = texts(buildCard({ ...base, nickname: null }).node);
    expect(all.some((s) => s.includes("의 기록"))).toBe(false);
  });

  it("lists every drawn character for font subsetting", () => {
    const card = buildCard(base);
    const drawn = texts(card.node).join("");
    const covered = new Set([...card.displayText, ...card.bodyText]);
    for (const c of uniqueChars(drawn)) expect(covered.has(c), c).toBe(true);
  });
});

describe("font subset helpers", () => {
  it("dedupes and drops whitespace", () => {
    expect(uniqueChars("기록 기록\n")).toBe("기록");
  });

  it("detects kana and kanji", () => {
    expect(hasJapanese("うさぎ")).toBe(true);
    expect(hasJapanese("原神")).toBe(true);
    expect(hasJapanese("토끼발 abc")).toBe(false);
  });
});
