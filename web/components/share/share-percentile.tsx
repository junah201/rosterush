"use client";

import type { ShareView } from "@rosterush/core";
import { mutedCard, rankNote } from "@/components/record/rank-note";
import type { Dict } from "@/lib/i18n";
import { rankOf, useLatestStats } from "@/lib/stats";

/** 공유 당시 백분위(스냅샷)와 현재 백분위를 나란히 보여준다 */
export function SharePercentile({ share, d }: { share: ShareView; d: Dict }) {
  const clear = share.endReason === "clear";
  const stats = useLatestStats(share.game, share.lang, share.difficulty, clear);

  if (!clear) return <div className={mutedCard}>{d.rankNeedsClear}</div>;

  const now = stats === undefined ? undefined : rankOf(share.totalMs, share.rosterVer, stats);

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
        {now?.kind === "top" && (
          <>
            <div className="shadow-sticker bg-sun font-heading mt-1 inline-block -rotate-2 rounded-full border-2 border-black px-3 text-2xl">
              {d.top(now.top)}
            </div>
            <div className="mt-1 text-xs font-bold">{d.amongClears(now.n)}</div>
          </>
        )}
        {now && now.kind !== "top" && (
          <div className="mt-1 text-sm font-bold text-[#5b6577]">{rankNote(now, d)}</div>
        )}
      </div>
    </div>
  );
}
