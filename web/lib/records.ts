import type { Difficulty, EndReason, Lang } from "@rosterush/core";

/** 이 브라우저에서 만든 기록 (resultId는 공유·댓글 첨부 때 본인 확인용) */
export type LocalRecord = {
  resultId: string;
  game: string;
  lang: Lang;
  difficulty: Difficulty;
  endReason: EndReason;
  totalMs: number;
  solved: number;
  total: number;
  at: number;
};

const KEY = "rosterush:records";
const MAX = 50;

export function loadRecords(): LocalRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as LocalRecord[];
  } catch {
    return [];
  }
}

export function saveRecord(r: LocalRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify([r, ...loadRecords()].slice(0, MAX)));
  } catch {
    // 저장소를 못 쓰는 환경(시크릿 모드 등)은 무시
  }
}
