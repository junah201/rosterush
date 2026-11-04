"use client";

import {
  buildLookup,
  type Difficulty,
  type EndReason,
  type GameDef,
  judge,
  type Lang,
  rosterAt,
  type Solves,
  TIME_LIMIT_MS,
} from "@rosterush/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** 타이머 시작 이후 경과 ms */
function elapsedSince(start: number | null): number {
  return start === null ? 0 : performance.now() - start;
}

export type Phase = "ready" | "playing" | "ended";

export type PlayResult = {
  endReason: EndReason;
  totalMs: number;
  solves: Solves;
};

/**
 * 게임 한 판의 상태.
 * - 타이머는 첫 입력에 시작
 * - 전원 정답 → clear, 10분 경과 → timeout, 포기 → giveup
 */
export function usePlay(game: GameDef, lang: Lang) {
  const [difficulty, setDifficultyState] = useState<Difficulty>("normal");
  const [phase, setPhase] = useState<Phase>("ready");
  const [solves, setSolves] = useState<Solves>({});
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [lastHit, setLastHit] = useState<{ id: string; at: number } | null>(null);

  const startRef = useRef<number | null>(null);
  const solvesRef = useRef<Solves>({});
  const phaseRef = useRef<Phase>("ready");

  const roster = useMemo(() => rosterAt(game), [game]);
  const lookup = useMemo(() => buildLookup(game, lang, difficulty), [game, lang, difficulty]);

  const finish = useCallback((endReason: EndReason, totalMs: number) => {
    if (phaseRef.current === "ended") return;
    phaseRef.current = "ended";
    const ms = Math.min(TIME_LIMIT_MS, Math.max(1, Math.round(totalMs)));
    setPhase("ended");
    setElapsed(ms);
    setResult({ endReason, totalMs: ms, solves: solvesRef.current });
  }, []);

  /** 첫 입력 시 타이머 시작 */
  const start = useCallback(() => {
    if (phaseRef.current !== "ready") return;
    phaseRef.current = "playing";
    startRef.current = performance.now();
    setPhase("playing");
  }, []);

  /** 입력값을 판정. 새로 맞혔으면 캐릭터 id 반환 */
  const answer = useCallback(
    (text: string): string | null => {
      if (phaseRef.current === "ended") return null;
      const id = judge(lookup, text);
      if (!id || solvesRef.current[id] !== undefined) return null;
      start();
      const ms = Math.max(1, Math.round(elapsedSince(startRef.current)));
      solvesRef.current = { ...solvesRef.current, [id]: ms };
      setSolves(solvesRef.current);
      setLastHit({ id, at: ms });
      if (Object.keys(solvesRef.current).length === roster.length) finish("clear", ms);
      return id;
    },
    [lookup, roster.length, start, finish],
  );

  const giveUp = useCallback(() => {
    if (phaseRef.current === "playing") finish("giveup", elapsedSince(startRef.current));
  }, [finish]);

  const reset = useCallback(() => {
    phaseRef.current = "ready";
    startRef.current = null;
    solvesRef.current = {};
    setPhase("ready");
    setSolves({});
    setElapsed(0);
    setResult(null);
    setLastHit(null);
  }, []);

  /** 난이도는 시작 전에만 변경 */
  const setDifficulty = useCallback((d: Difficulty) => {
    if (phaseRef.current === "ready") setDifficultyState(d);
  }, []);

  // 타이머 표시 + 시간 초과
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    const tick = () => {
      const t = elapsedSince(startRef.current);
      if (t >= TIME_LIMIT_MS) return finish("timeout", TIME_LIMIT_MS);
      setElapsed(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, finish]);

  return {
    difficulty,
    setDifficulty,
    phase,
    solves,
    elapsed,
    remaining: TIME_LIMIT_MS - elapsed,
    roster,
    result,
    lastHit,
    start,
    answer,
    giveUp,
    reset,
  };
}

export type Play = ReturnType<typeof usePlay>;
