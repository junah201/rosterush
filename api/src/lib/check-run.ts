import { type GameDef, isKnownRosterVer, type ResultRequest, rosterAt } from "@rosterush/core";
import { HttpError } from "./http";

/** 캐릭터당 평균이 이보다 빠르면 의심 기록 */
const MIN_AVG_MS_PER_CHAR = 300;

/**
 * 기록 검증.
 * 명백히 잘못된 요청은 에러, 의심스러운 기록은 저장하되 flagged=true (집계·공유 제외).
 */
export function checkRun(game: GameDef, req: ResultRequest): { flagged: boolean } {
  if (!isKnownRosterVer(game, req.rosterVer))
    throw new HttpError("UNKNOWN_ROSTER_VER", "unknown rosterVer");

  const roster = new Set(rosterAt(game, req.rosterVer).map((c) => c.id));
  const entries = Object.entries(req.solves);
  for (const [id, ms] of entries) {
    if (!roster.has(id)) throw new HttpError("INVALID_INPUT", `unknown character: ${id}`);
    if (ms > req.totalMs) throw new HttpError("INVALID_INPUT", `solve time exceeds totalMs: ${id}`);
  }
  if (req.endReason === "clear" && entries.length !== roster.size) {
    throw new HttpError("INVALID_INPUT", "clear requires all characters");
  }

  const tooFast = entries.length > 0 && req.totalMs / entries.length < MIN_AVG_MS_PER_CHAR;
  return { flagged: tooFast };
}
