"use client";

import { type CommentRecord, type Lang, type LatestStats, topPercent } from "@rosterush/core";
import { useEffect, useState } from "react";
import { formatTime } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { latestStatsOnce } from "@/lib/stats";

/**
 * 댓글에 첨부된 기록 카드. 백분위는 저장하지 않고 지금 latest.json으로 계산한다.
 * - 완주 + 같은 rosterVer → "상위 X%"
 * - 완주인데 로스터가 바뀜 → "이전 로스터"
 * - 완주가 아니면 → "63/98"
 * 누르면 공유 페이지(/s/{shareId})로 간다.
 */
export function RecordChip({
  game,
  lang,
  record,
  d,
}: {
  game: string;
  lang: Lang;
  record: CommentRecord;
  d: Dict;
}) {
  const clear = record.endReason === "clear";
  const [stats, setStats] = useState<LatestStats | null | undefined>(undefined);

  useEffect(() => {
    if (!clear) return;
    let alive = true;
    latestStatsOnce(game, record.lang, record.difficulty).then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, [clear, game, record.lang, record.difficulty]);

  let tail: string | null = null;
  if (!clear) tail = `${record.solved}/${record.total}`;
  else if (stats && stats.rosterVer !== record.rosterVer) tail = d.oldRoster;
  else if (stats) {
    const top = topPercent(record.totalMs, stats.clearTime);
    if (top !== null) tail = d.top(top);
  }

  return (
    <a
      href={`/s/${record.shareId}`}
      className={`shadow-sticker-sm mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border-2 border-black px-3 py-1.5 text-xs font-black ${clear ? "bg-sun" : "bg-white"}`}
    >
      <span className="rounded-md border-2 border-black bg-[#7ee0c3] px-1.5">
        {d.difficulty[record.difficulty]}
      </span>
      {record.lang !== lang && <span className="uppercase">{record.lang}</span>}
      <span>{d.end[record.endReason]}</span>
      <span className="tabular-nums">{formatTime(record.totalMs)}</span>
      {tail && <span>· {tail}</span>}
    </a>
  );
}
