export const LANGS = ["ko", "ja", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const DIFFICULTIES = ["easy", "normal", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const END_REASONS = ["clear", "giveup", "timeout"] as const;
export type EndReason = (typeof END_REASONS)[number];

/** 게임 제한 시간 (10분) */
export const TIME_LIMIT_MS = 600_000;

export type Localized = Record<Lang, string>;

// ─── 게임 정의 (games/*.json) ────────────────────────────────────────────

export type GameIndexEntry = {
  id: string;
  category: string;
  enabled: boolean;
};

export type Group = {
  id: string;
  name: Localized;
  icon?: string;
  /** 디자인용 그룹 색 (예: 돌격 노랑) */
  color?: string;
};

export type Grouping = {
  id: string;
  name: Localized;
  /** 배열 순서 = 화면 표시 순서 */
  groups: Group[];
};

export type CharacterNames = { full: string[]; short: string[] };

export type Character = {
  id: string;
  /** 이 캐릭터가 추가된 rosterVer */
  addedIn: number;
  /** groupingId → groupId */
  groups?: Record<string, string>;
  /** groupingId → 우선순위 (작을수록 앞) */
  priority?: Record<string, number>;
  /** 컬러 초상화 경로, 맞힌 뒤 표시 (예: "overwatch/8b2d07e4c1a9.webp"). pnpm images:build가 채움 */
  image?: string;
  /** 쉬움 모드 실루엣 경로. image와 파일명이 무관해야 함 (실루엣에서 정답 추측 방지) */
  silhouette?: string;
  names: Record<Lang, CharacterNames>;
};

export type GameDef = {
  id: string;
  rosterVer: number;
  name: Localized;
  /** 첫 번째 = 기본 그룹핑 */
  groupings?: Grouping[];
  characters: Character[];
};

// ─── 기록 ────────────────────────────────────────────────────────────────

/** 캐릭터 id → 시작부터 맞힐 때까지 경과 ms */
export type Solves = Record<string, number>;

export type Run = {
  rosterVer: number;
  endReason: EndReason;
  totalMs: number;
  solves: Solves;
};
