"use client";

import { type Difficulty, type GameDef, type Lang, rosterAt } from "@rosterush/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { RecordSummary, recordTitle } from "@/components/record/record-summary";
import { ShareBox } from "@/components/share/share-box";
import { Button } from "@/components/ui/button";
import { ApiRequestError, postResult } from "@/lib/api";
import type { Dict } from "@/lib/i18n";
import { saveRecord } from "@/lib/records";
import { PercentileCard } from "./percentile-card";
import type { PlayResult } from "./use-play";

type SaveState =
  | { s: "saving" }
  | { s: "saved"; resultId: string }
  | { s: "failed"; limited: boolean };

type Props = {
  game: GameDef;
  lang: Lang;
  d: Dict;
  difficulty: Difficulty;
  result: PlayResult;
  onRetry: () => void;
};

export function ResultPanel({ game, lang, d, difficulty, result, onRetry }: Props) {
  const [save, setSave] = useState<SaveState>({ s: "saving" });
  const sent = useRef(false);
  const total = rosterAt(game).length;
  const solved = Object.keys(result.solves).length;

  const submit = useCallback(async () => {
    setSave({ s: "saving" });
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
      setSave({ s: "saved", resultId });
    } catch (err) {
      const limited = err instanceof ApiRequestError && err.code === "RATE_LIMITED";
      setSave({ s: "failed", limited });
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
        <RecordSummary
          d={d}
          endReason={result.endReason}
          totalMs={result.totalMs}
          solved={solved}
          total={total}
        />
      </div>

      <PercentileCard game={game} lang={lang} d={d} difficulty={difficulty} result={result} />

      <div className="text-center text-xs font-bold" aria-live="polite">
        {save.s === "saving" && <span className="text-[#5b6577]">{d.saving}</span>}
        {save.s === "saved" && <span className="text-brand">✓ {d.saved}</span>}
        {save.s === "failed" && (
          <span className="text-[#c2405b]">
            {save.limited ? d.commentErrors.RATE_LIMITED : d.saveFailed} ·{" "}
            <button type="button" className="underline" onClick={() => void submit()}>
              {d.saveRetry}
            </button>
          </span>
        )}
      </div>

      {save.s === "saved" && (
        <ShareBox
          resultId={save.resultId}
          title={recordTitle(game.name[lang], d, result.endReason, result.totalMs)}
          d={d}
        />
      )}

      <Button variant="brand" size="lg" className="w-full" onClick={onRetry}>
        {d.retry}
      </Button>
    </div>
  );
}
