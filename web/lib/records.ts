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

/** 같은 탭에서 기록이 저장됐을 때 알리는 이벤트 (다른 탭은 storage 이벤트로 알 수 있다) */
const CHANGED = "rosterush:records-changed";

export function saveRecord(r: LocalRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify([r, ...loadRecords()].slice(0, MAX)));
  } catch {
    // 저장소를 못 쓰는 환경(시크릿 모드 등)은 무시
  }
  window.dispatchEvent(new Event(CHANGED));
}

/**
 * 기록 목록이 바뀔 때마다 cb를 부른다 (이 탭에서 저장했거나 다른 탭에서 저장했을 때).
 * 화면에 먼저 떠 있던 폼(예: 댓글 작성)도 방금 끝낸 기록을 고를 수 있게 하려는 것. 해제 함수를 돌려준다.
 */
export function onRecordsChange(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(CHANGED, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGED, cb);
    window.removeEventListener("storage", onStorage);
  };
}
