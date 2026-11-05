/** ms → "mm:ss.cc" (기록 표기: 결과 화면, 공유 페이지, OG 카드, 댓글 첨부 기록) */
export function formatTime(ms: number): string {
  const cs = Math.floor(ms / 10);
  const m = Math.floor(cs / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}
