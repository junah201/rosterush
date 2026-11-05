"use client";

import type { Difficulty, GameDef, Lang } from "@rosterush/core";
import { mutedCard, rankNote } from "@/components/record/rank-note";
import type { Dict } from "@/lib/i18n";
import { rankOf, useLatestStats } from "@/lib/stats";
import type { PlayResult } from "./use-play";

type Props = {
  game: GameDef;
  lang: Lang;
  d: Dict;
  difficulty: Difficulty;
  result: PlayResult;
};

/** 집계 결과(latest.json)로 "상위 X%"를 계산해 보여준다 */
export function PercentileCard({ game, lang, d, difficulty, result }: Props) {
  const clear = result.endReason === "clear";
  const stats = useLatestStats(game.id, lang, difficulty, clear);

  if (!clear) return <div className={mutedCard}>{d.rankNeedsClear}</div>;
  if (stats === undefined) return <div className={mutedCard}>…</div>;

  const rank = rankOf(result.totalMs, game.rosterVer, stats);
  if (rank.kind !== "top") return <div className={mutedCard}>{rankNote(rank, d)}</div>;

  // rank.kind가 top이면 stats는 null이 아니다 (rankOf가 null이면 pending을 돌려준다)
  const runs = stats?.runs;
  const clearRate = runs?.total ? Math.round((runs.clear / runs.total) * 100) : 0;

  return (
    <div className="shadow-sticker rounded-2xl border-2 border-black bg-white p-4">
      <div className="shadow-sticker bg-sun font-heading inline-block -rotate-3 rounded-full border-2 border-black px-4 py-1 text-2xl">
        {d.top(rank.top)}
      </div>
      <div className="mt-2 text-sm font-bold">{d.amongClears(rank.n)}</div>
      <div className="text-xs text-[#5b6577]">
        {d.clearRate} {clearRate}%
      </div>
    </div>
  );
}
