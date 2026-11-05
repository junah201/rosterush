import { type EndReason, formatTime } from "@rosterush/core";
import type { Dict } from "@/lib/i18n";

/** 공유 시트·문서 제목에 쓰는 기록 한 줄 (예: "원신 · 올 클리어! 03:42.17") */
export const recordTitle = (gameName: string, d: Dict, endReason: EndReason, totalMs: number) =>
  `${gameName} · ${d.end[endReason]} ${formatTime(totalMs)}`;

/** 기록 카드 본문: 끝난 이유 배지 → 기록 시간 → 맞힌 수 (결과 화면, 공유 페이지) */
export function RecordSummary({
  d,
  endReason,
  totalMs,
  solved,
  total,
  className,
}: {
  d: Dict;
  endReason: EndReason;
  totalMs: number;
  solved: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="inline-block -rotate-3 rounded-full border-2 border-black bg-white px-3 py-0.5 text-sm font-black">
        {d.end[endReason]}
      </div>
      <div className="mt-3 text-xs font-bold text-[#5b6577]">{d.record}</div>
      <div className="font-heading text-4xl tabular-nums">{formatTime(totalMs)}</div>
      <div className="mt-1 text-lg font-black">
        {solved} / {total}
      </div>
    </div>
  );
}
