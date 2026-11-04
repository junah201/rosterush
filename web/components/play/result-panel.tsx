"use client";

import { type Difficulty, type GameDef, type Lang, rosterAt } from "@rosterush/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { postResult } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { saveRecord } from "@/lib/records";
import { PercentileCard } from "./percentile-card";
import type { PlayResult } from "./use-play";

type SaveState = "saving" | "saved" | "failed";

type Props = {
  game: GameDef;
  lang: Lang;
  d: Dict;
  difficulty: Difficulty;
  result: PlayResult;
  onRetry: () => void;
};

export function ResultPanel({ game, lang, d, difficulty, result, onRetry }: Props) {
  const [save, setSave] = useState<SaveState>("saving");
  const sent = useRef(false);
  const total = rosterAt(game).length;
  const solved = Object.keys(result.solves).length;

  const submit = useCallback(async () => {
    setSave("saving");
    try {
      const { resultId } = await postResult({
        game: game.id,
        lang,
        difficulty,
        rosterVer: game.rosterVer,
        endReason: result.endReason,
        totalMs: result.totalMs,
        solves: result.solves,
      });
      saveRecord({
        resultId,
        game: game.id,
        lang,
        difficulty,
        endReason: result.endReason,
        totalMs: result.totalMs,
        solved,
        total,
        at: Date.now(),
      });
      setSave("saved");
    } catch {
      setSave("failed");
    }
  }, [game, lang, difficulty, result, solved, total]);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void submit();
  }, [submit]);

  const clear = result.endReason === "clear";

  return (
    <div className="space-y-4">
      <div
        className={`shadow-sticker rr-pop rounded-2xl border-2 border-black p-5 ${clear ? "bg-sun" : "bg-white"}`}
      >
        <div className="inline-block -rotate-3 rounded-full border-2 border-black bg-white px-3 py-0.5 text-sm font-black">
          {d.end[result.endReason]}
        </div>
        <div className="mt-3 text-xs font-bold text-[#5b6577]">{d.record}</div>
        <div className="font-heading text-4xl tabular-nums">{formatTime(result.totalMs)}</div>
        <div className="mt-1 text-lg font-black">
          {solved} / {total}
        </div>
      </div>

      <PercentileCard game={game} lang={lang} d={d} difficulty={difficulty} result={result} />

      <div className="text-center text-xs font-bold" aria-live="polite">
        {save === "saving" && <span className="text-[#5b6577]">{d.saving}</span>}
        {save === "saved" && <span className="text-brand">✓ {d.saved}</span>}
        {save === "failed" && (
          <span className="text-[#c2405b]">
            {d.saveFailed} ·{" "}
            <button type="button" className="underline" onClick={() => void submit()}>
              {d.saveRetry}
            </button>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="bg-brand w-full rounded-xl border-2 border-black py-3 font-black text-white shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        {d.retry}
      </button>
    </div>
  );
}
