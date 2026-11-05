/** 공유·댓글에 쓸 닉네임을 이 브라우저에 기억해 둔다 */
const KEY = "rosterush:nickname";

export const NICKNAME_MAX = 12;

export function loadNickname(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveNickname(v: string) {
  try {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch {
    // 저장소를 못 쓰는 환경은 무시
  }
}
