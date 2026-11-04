"use client";

import {
  type Difficulty,
  type GameDef,
  type Lang,
  type LatestStats,
  topPercent,
} from "@rosterush/core";
import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { fetchLatestStats } from "@/lib/stats";
import type { PlayResult } from "./use-play";

type Props = {
  game: GameDef;
  lang: Lang;
  d: Dict;
  difficulty: Difficulty;
  result: PlayResult;
};

const muted =
  "shadow-sticker rounded-2xl border-2 border-dashed border-black bg-white p-4 text-center text-sm font-bold text-[#5b6577]";

/** 집계 결과(latest.json)로 "상위 X%"를 계산해 보여준다 */
export function PercentileCard({ game, lang, d, difficulty, result }: Props) {
  const [stats, setStats] = useState<LatestStats | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    fetchLatestStats(game.id, lang, difficulty).then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, [game.id, lang, difficulty]);

  if (stats === undefined) return <div className={muted}>…</div>;
  if (result.endReason !== "clear") return <div className={muted}>{d.rankNeedsClear}</div>;
  if (!stats) return <div className={muted}>{d.percentilePending}</div>;
  if (stats.rosterVer !== game.rosterVer) return <div className={muted}>{d.rosterChanged}</div>;

  const top = topPercent(result.totalMs, stats.clearTime);
  if (top === null)
    return <div className={muted}>{d.collecting(stats.clearTime.n, stats.minSample)}</div>;

  const clearRate = stats.runs.total ? Math.round((stats.runs.clear / stats.runs.total) * 100) : 0;

  return (
    <div className="shadow-sticker rounded-2xl border-2 border-black bg-white p-4">
      <div className="shadow-sticker bg-sun font-heading inline-block -rotate-3 rounded-full border-2 border-black px-4 py-1 text-2xl">
        {d.top(top)}
      </div>
      <div className="mt-2 text-sm font-bold">{d.amongClears(stats.clearTime.n)}</div>
      <div className="text-xs text-[#5b6577]">
        {d.clearRate} {clearRate}%
      </div>
    </div>
  );
}
