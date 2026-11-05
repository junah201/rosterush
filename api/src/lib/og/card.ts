import { type Difficulty, type EndReason, formatTime, type Lang } from "@rosterush/core";

/**
 * 공유 미리보기 이미지 (1200×630) — 시안 A "스티커 기록증".
 * 결과 화면(ResultPanel + PercentileCard)과 같은 규칙: 완주면 기록 카드가 노란색, 아니면 흰색.
 * satori는 flexbox만 지원하므로 모든 div에 display:flex를 넣는다.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type CardInput = {
  lang: Lang;
  gameName: string;
  difficulty: Difficulty;
  endReason: EndReason;
  totalMs: number;
  solved: number;
  total: number;
  percentile: number | null;
  nickname: string | null;
};

/** 이미지와 공유 페이지 메타 태그가 같이 쓰는 문구 (web/lib/i18n.ts와 맞출 것) */
export const LABELS = {
  ko: {
    end: { clear: "올 클리어!", giveup: "포기", timeout: "시간 초과" },
    record: "기록",
    top: "상위",
    collected: "수집률",
    difficulty: { easy: "쉬움", normal: "보통", hard: "어려움" },
    tagline: "캐릭터 이름을 전부 불러봐!",
    by: (n: string) => `${n}의 기록`,
  },
  ja: {
    end: { clear: "オールクリア！", giveup: "ギブアップ", timeout: "時間切れ" },
    record: "記録",
    top: "上位",
    collected: "収集率",
    difficulty: { easy: "かんたん", normal: "ふつう", hard: "むずかしい" },
    tagline: "キャラの名前を全部言えるかな？",
    by: (n: string) => `${n} の記録`,
  },
  en: {
    end: { clear: "All clear!", giveup: "Gave up", timeout: "Time's up" },
    record: "Time",
    top: "Top",
    collected: "Collected",
    difficulty: { easy: "Easy", normal: "Normal", hard: "Hard" },
    tagline: "Name every character you can!",
    by: (n: string) => `${n}'s run`,
  },
} satisfies Record<Lang, unknown>;

const C = { brand: "#1f3cff", sun: "#ffd23f", paper: "#eef1f6", dot: "#c3cad8", muted: "#5b6577" };

/** 디스플레이 글꼴 (라틴·숫자만 쓰임: 로고, 기록, 배지 숫자) */
export const DISPLAY_FONT = "Dela Gothic One";

/** satori가 받는 React 요소 형태 (React 없이 만든다) */
export type OgNode = {
  type: "div";
  props: {
    style: Record<string, string | number>;
    children?: (OgNode | string)[] | OgNode | string;
  };
};

const div = (style: Record<string, string | number>, ...children: (OgNode | string)[]): OgNode => ({
  type: "div",
  // satori 기본값은 content-box라 padding·border가 width 밖으로 늘어난다
  props: { style: { display: "flex", boxSizing: "border-box", ...style }, children },
});

export type Card = {
  node: OgNode;
  /** 디스플레이 글꼴로 그리는 글자 */
  displayText: string;
  /** 본문 글꼴로 그리는 글자 (닉네임 포함) */
  bodyText: string;
};

/** 원형 배지(지름 300) 안에 들어가는 글자 크기. Dela Gothic One의 대략적인 글자 폭(em) 기준 */
const BADGE_TEXT_WIDTH = 230;
export function badgeFontSize(text: string): number {
  const em = Array.from(text).reduce((w, c) => w + (c === "." ? 0.35 : c === "%" ? 1 : 0.8), 0);
  return Math.min(112, Math.floor(BADGE_TEXT_WIDTH / em));
}

/** 점무늬 종이 배경 (사이트 body 배경과 같은 무늬). satori의 radial-gradient는 반복 타일로 안 그려져서 SVG 타일을 쓴다 */
const DOT_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="1.8" fill="${C.dot}"/></svg>`,
)}")`;

export function buildCard(input: CardInput): Card {
  const t = LABELS[input.lang];
  const clear = input.endReason === "clear";
  const ranked = input.percentile !== null;
  const time = formatTime(input.totalMs);
  const big = ranked
    ? `${input.percentile}%`
    : `${input.total ? Math.floor((input.solved / input.total) * 100) : 0}%`;
  const bigSize = badgeFontSize(big);

  const endLabel = t.end[input.endReason];
  const badgeLabel = ranked ? t.top : t.collected;
  const diff = t.difficulty[input.difficulty];
  const solvedText = `${input.solved} / ${input.total}`;
  const byText = input.nickname ? t.by(input.nickname) : null;

  const chip = (text: string, bg: string) =>
    div(
      {
        background: bg,
        border: "3px solid #000",
        borderRadius: 999,
        padding: "4px 18px",
        fontSize: 24,
        fontWeight: 900,
        boxShadow: "3px 3px 0 #000",
        maxWidth: 420,
      },
      text,
    );

  const node = div(
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      flexDirection: "column",
      padding: "48px 60px",
      backgroundColor: C.paper,
      backgroundImage: DOT_TILE,
      backgroundSize: "24px 24px",
      backgroundRepeat: "repeat",
      color: "#000",
    },
    // 상단: 로고 + 게임/난이도
    div(
      { alignItems: "center", justifyContent: "space-between" },
      div(
        {
          background: C.brand,
          color: "#fff",
          fontFamily: DISPLAY_FONT,
          fontSize: 36,
          padding: "6px 16px",
          border: "3px solid #000",
          boxShadow: "5px 5px 0 #000",
          transform: "rotate(-2deg)",
        },
        "ROSTERUSH",
      ),
      div({ gap: 12 }, chip(input.gameName, "#fff"), chip(diff, C.sun)),
    ),
    // 가운데: 기록 카드 + 배지
    div(
      { flexGrow: 1, alignItems: "center", gap: 48, marginTop: 28 },
      div(
        {
          flexDirection: "column",
          width: 700,
          background: clear ? C.sun : "#fff",
          border: "4px solid #000",
          borderRadius: 28,
          boxShadow: "10px 10px 0 #000",
          padding: "30px 40px",
        },
        div(
          {
            alignSelf: "flex-start",
            background: "#fff",
            border: "3px solid #000",
            borderRadius: 999,
            padding: "4px 18px",
            fontSize: 26,
            fontWeight: 900,
            transform: "rotate(-3deg)",
          },
          endLabel,
        ),
        div({ marginTop: 18, fontSize: 24, fontWeight: 700, color: C.muted }, t.record),
        div({ fontFamily: DISPLAY_FONT, fontSize: 112, lineHeight: 1.05, letterSpacing: -2 }, time),
        div(
          { alignItems: "baseline", justifyContent: "space-between", marginTop: 6 },
          div({ fontSize: 44, fontWeight: 900 }, solvedText),
          ...(byText
            ? [div({ fontSize: 24, fontWeight: 700, color: clear ? "#000" : C.muted }, byText)]
            : []),
        ),
      ),
      div(
        {
          width: 300,
          height: 300,
          borderRadius: 999,
          background: "#fff",
          border: "4px solid #000",
          boxShadow: "8px 8px 0 #000",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(6deg)",
        },
        div({ fontSize: 30, fontWeight: 900 }, badgeLabel),
        div({ fontFamily: DISPLAY_FONT, fontSize: bigSize, color: C.brand, lineHeight: 1 }, big),
      ),
    ),
    div({ fontSize: 22, fontWeight: 700, color: C.muted }, t.tagline),
  );

  return {
    node,
    displayText: `ROSTERUSH${time}${big}`,
    bodyText: [
      input.gameName,
      diff,
      endLabel,
      t.record,
      solvedText,
      byText ?? "",
      badgeLabel,
      t.tagline,
    ].join(""),
  };
}
