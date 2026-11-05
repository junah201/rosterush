"use client";

import { type LatestStats, type ShareView, topPercent } from "@rosterush/core";
import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { fetchLatestStats } from "@/lib/stats";

const muted =
  "shadow-sticker rounded-2xl border-2 border-dashed border-black bg-white p-4 text-center text-sm font-bold text-[#5b6577]";

type Rank = { top: number; n: number } | { text: string };

/** 지금 집계(latest.json) 기준의 "상위 X%". 계산할 수 없으면 그 이유 문구 */
function currentRank(share: ShareView, stats: LatestStats | null, d: Dict): Rank {
  if (!stats) return { text: d.percentilePending };
  if (stats.rosterVer !== share.rosterVer) return { text: d.rosterChanged };
  const top = topPercent(share.totalMs, stats.clearTime);
  if (top === null) return { text: d.collecting(stats.clearTime.n, stats.minSample) };
  return { top, n: stats.clearTime.n };
}

/** 공유 당시 백분위(스냅샷)와 현재 백분위를 나란히 보여준다 */
export function SharePercentile({ share, d }: { share: ShareView; d: Dict }) {
  const [stats, setStats] = useState<LatestStats | null | undefined>(undefined);
  const clear = share.endReason === "clear";

  useEffect(() => {
    if (!clear) return;
    let alive = true;
    fetchLatestStats(share.game, share.lang, share.difficulty).then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, [clear, share.game, share.lang, share.difficulty]);

  if (!clear) return <div className={muted}>{d.rankNeedsClear}</div>;

  const now = stats === undefined ? undefined : currentRank(share, stats, d);

  return (
    <div className="shadow-sticker grid grid-cols-2 divide-x-2 divide-black rounded-2xl border-2 border-black bg-white">
      <div className="p-4">
        <div className="text-xs font-bold text-[#5b6577]">{d.atShare}</div>
        {share.percentile !== null ? (
          <div className="font-heading mt-1 text-2xl">{d.top(share.percentile)}</div>
        ) : (
          <div className="mt-1 text-sm font-bold text-[#5b6577]">{d.percentilePending}</div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs font-bold text-[#5b6577]">{d.now}</div>
        {now === undefined && <div className="mt-1 text-2xl">…</div>}
        {now && "top" in now && (
          <>
            <div className="shadow-sticker bg-sun font-heading mt-1 inline-block -rotate-2 rounded-full border-2 border-black px-3 text-2xl">
              {d.top(now.top)}
            </div>
            <div className="mt-1 text-xs font-bold">{d.amongClears(now.n)}</div>
          </>
        )}
        {now && "text" in now && (
          <div className="mt-1 text-sm font-bold text-[#5b6577]">{now.text}</div>
        )}
      </div>
    </div>
  );
}
