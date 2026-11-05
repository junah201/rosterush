import { type GameDef, LANGS, type Localized, normalize } from "@rosterush/core";

const IMAGE_RE = /^[a-z0-9_]+\/[A-Za-z0-9_-]+\.webp$/;

/** 게임 정의 검증. 문제 목록을 반환 (빈 배열 = 통과) */
export function validateGame(game: GameDef): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`[${game.id}] ${msg}`);

  const checkLocalized = (what: string, l: Localized | undefined) => {
    for (const lang of LANGS) if (!l?.[lang]?.trim()) err(`${what}: ${lang} 이름 누락`);
  };

  checkLocalized("게임 이름", game.name);
  if (!Number.isInteger(game.rosterVer) || game.rosterVer < 1) err("rosterVer는 1 이상의 정수");

  const groupings = game.groupings ?? [];
  const groupIds = new Map(groupings.map((g) => [g.id, new Set(g.groups.map((x) => x.id))]));
  for (const g of groupings) {
    checkLocalized(`그룹핑 ${g.id}`, g.name);
    for (const grp of g.groups) checkLocalized(`그룹 ${g.id}/${grp.id}`, grp.name);
  }

  const ids = new Set<string>();
  for (const c of game.characters) {
    if (ids.has(c.id)) err(`캐릭터 id 중복: ${c.id}`);
    ids.add(c.id);

    if (!Number.isInteger(c.addedIn) || c.addedIn < 1 || c.addedIn > game.rosterVer)
      err(`${c.id}: addedIn은 1~${game.rosterVer} 사이 정수`);

    for (const [gid, groups] of groupIds) {
      const v = c.groups?.[gid];
      if (!v) err(`${c.id}: 그룹핑 "${gid}"의 그룹 누락`);
      else if (!groups.has(v)) err(`${c.id}: 그룹 "${gid}/${v}" 정의 없음`);
    }
    for (const gid of Object.keys(c.groups ?? {}))
      if (!groupIds.has(gid)) err(`${c.id}: 정의되지 않은 그룹핑 "${gid}"`);
    for (const [gid, p] of Object.entries(c.priority ?? {})) {
      if (!groupIds.has(gid)) err(`${c.id}: priority의 그룹핑 "${gid}" 정의 없음`);
      if (!Number.isInteger(p)) err(`${c.id}: priority.${gid}는 정수`);
    }

    for (const lang of LANGS)
      if (!c.names[lang]?.full.length) err(`${c.id}: ${lang} full 이름 누락`);

    for (const field of ["image", "silhouette"] as const) {
      const path = c[field];
      if (path === undefined) continue;
      if (!IMAGE_RE.test(path) || !path.startsWith(`${game.id}/`))
        err(`${c.id}: ${field}는 "${game.id}/{파일명}.webp" 형식`);
      if (path.toLowerCase().includes(c.id.toLowerCase()))
        err(`${c.id}: ${field} 파일명에 캐릭터 id 사용 금지 (정답 노출)`);
    }
    if (c.silhouette !== undefined && c.silhouette === c.image)
      err(`${c.id}: silhouette와 image가 같은 파일`);
  }

  if (!game.characters.some((c) => c.addedIn === game.rosterVer))
    err(`최신 rosterVer(${game.rosterVer})에 추가된 캐릭터가 없음`);

  // 같은 언어 안에서 정규화된 별칭 충돌 (full + short 전체 기준)
  for (const lang of LANGS) {
    const owner = new Map<string, string>();
    for (const c of game.characters) {
      const n = c.names[lang];
      for (const name of [...(n?.full ?? []), ...(n?.short ?? [])]) {
        const key = normalize(name);
        if (!key) err(`${c.id}: ${lang} 이름 "${name}"이 정규화 후 빈 문자열`);
        const prev = owner.get(key);
        if (prev && prev !== c.id) err(`${lang} 별칭 충돌: "${name}" → ${prev}, ${c.id}`);
        owner.set(key, c.id);
      }
    }
  }

  return errors;
}
