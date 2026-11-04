import { LANGS, type Lang } from "@rosterush/core";

export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

const dict = {
  ko: {
    tagline: "캐릭터 이름을 전부 불러봐!",
    play: "도전하기",
    characters: "명",
    difficulty: { easy: "쉬움", normal: "보통", hard: "어려움" },
  },
  ja: {
    tagline: "キャラの名前を全部言えるかな？",
    play: "挑戦する",
    characters: "人",
    difficulty: { easy: "かんたん", normal: "ふつう", hard: "むずかしい" },
  },
  en: {
    tagline: "Name every character you can!",
    play: "Play",
    characters: " characters",
    difficulty: { easy: "Easy", normal: "Normal", hard: "Hard" },
  },
} satisfies Record<Lang, unknown>;

export const t = (lang: Lang) => dict[lang];
