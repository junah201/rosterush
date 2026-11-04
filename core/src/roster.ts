import { normalize } from "./normalize";
import type { Character, Difficulty, GameDef, Lang } from "./types";

/** 버전 v의 로스터 = addedIn ≤ v 인 캐릭터 */
export function rosterAt(game: GameDef, rosterVer: number = game.rosterVer): Character[] {
  return game.characters.filter((c) => c.addedIn <= rosterVer);
}

export function isKnownRosterVer(game: GameDef, rosterVer: number): boolean {
  return Number.isInteger(rosterVer) && rosterVer >= 1 && rosterVer <= game.rosterVer;
}

/** 난이도별로 정답으로 인정하는 이름 목록 */
export function acceptedNames(c: Character, lang: Lang, difficulty: Difficulty): string[] {
  const n = c.names[lang];
  return difficulty === "hard" ? n.full : [...n.full, ...n.short];
}

/** (게임, 언어, 난이도) → `정규화된 이름 → 캐릭터 id` 조회표 */
export function buildLookup(
  game: GameDef,
  lang: Lang,
  difficulty: Difficulty,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of rosterAt(game)) {
    for (const name of acceptedNames(c, lang, difficulty)) map.set(normalize(name), c.id);
  }
  return map;
}

/** 입력값이 정답이면 캐릭터 id, 아니면 null */
export function judge(lookup: Map<string, string>, input: string): string | null {
  return lookup.get(normalize(input)) ?? null;
}

/**
 * 그룹핑 기준으로 정렬된 그룹 목록.
 * 그룹 순서 → priority 오름차순(없으면 뒤) → characters 배열 순서.
 */
export function groupCharacters(game: GameDef, groupingId?: string, rosterVer?: number) {
  const roster = rosterAt(game, rosterVer);
  const grouping = game.groupings?.find((g) => g.id === groupingId) ?? game.groupings?.[0];
  if (!grouping) return [{ group: null, characters: roster }];

  const order = new Map(roster.map((c, i) => [c.id, i]));
  const prio = (c: Character) => c.priority?.[grouping.id] ?? Number.POSITIVE_INFINITY;

  return grouping.groups.map((group) => ({
    group,
    characters: roster
      .filter((c) => c.groups?.[grouping.id] === group.id)
      .sort((a, b) => prio(a) - prio(b) || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
  }));
}
