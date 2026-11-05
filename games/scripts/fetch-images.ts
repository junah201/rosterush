/**
 * 캐릭터 원본 이미지를 공개 소스에서 내려받아 games/images/{game}/{id}.png 로 저장한다.
 * 그다음 pnpm images:build 로 변환.
 *
 * 사용: pnpm images:fetch [게임id...] [--force]
 *   --force: 이미 있는 파일도 다시 받음 (기본은 건너뜀 → 손으로 넣은 이미지를 덮어쓰지 않음)
 *
 * 소스 (커뮤니티 데이터, 바뀌거나 사라질 수 있음):
 *   overwatch  OverFast API 영웅 초상화 (공식 사이트 이미지, 얼굴 클로즈업이라 실루엣은 생략됨)
 *   genshin    Project Amber(gi.yatta.moe) 캐릭터 아이콘 (투명 배경)
 *   starrail   GitHub Mar-7th/StarRailRes 캐릭터 아이콘 (투명 배경)
 *
 * 매칭: 소스의 이름을 id 규칙(소문자, 영숫자 외 "_")으로 바꿔 캐릭터 id와 비교.
 * 이름이 다른 캐릭터는 아래 OVERRIDES에 소스 쪽 식별자를 적는다.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { gameIndex, getGame } from "../src/index";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SRC_DIR = join(ROOT, "games/images");
const UA = "rosterush-image-collector (+https://github.com/junah201/rosterush)";
const CONCURRENCY = 4;

/** 소스의 한 캐릭터. aliases 중 하나가 캐릭터 id(또는 OVERRIDES 값)와 같으면 매칭 */
type Entry = { aliases: string[]; url: string; label: string };
type Source = { name: string; list: () => Promise<Entry[]> };

/** 캐릭터 id → 소스 쪽 식별자 (이름 자동 매칭이 안 되거나 후보가 여럿일 때) */
const OVERRIDES: Record<string, Record<string, string>> = {
  // 남/녀 주인공 중 하나만 쓴다. 바꾸려면 PlayerBoy / 8001 로
  genshin: { traveler: "UI_AvatarIcon_PlayerGirl" },
  starrail: { trailblazer: "8002" },
};

const toId = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

const SOURCES: Record<string, Source> = {
  overwatch: {
    name: "OverFast API",
    async list() {
      const heroes = await getJson<{ key: string; name: string; portrait: string }[]>(
        "https://overfast-api.tekrop.fr/heroes",
      );
      return heroes.map((h) => ({
        aliases: [toId(h.key), toId(h.name)],
        url: h.portrait,
        label: h.name,
      }));
    },
  },
  genshin: {
    name: "Project Amber",
    async list() {
      const res = await getJson<{
        data: { items: Record<string, { id: string | number; name: string; icon: string }> };
      }>("https://gi.yatta.moe/api/v2/en/avatar");
      return Object.values(res.data.items).map((a) => ({
        aliases: [toId(a.name), a.icon, String(a.id)],
        url: `https://gi.yatta.moe/assets/UI/${a.icon}.png`,
        label: a.name,
      }));
    },
  },
  starrail: {
    name: "StarRailRes",
    async list() {
      const base = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master";
      const chars = await getJson<
        Record<string, { id: string; name: string; tag: string; icon: string }>
      >(`${base}/index_new/en/characters.json`);
      return Object.values(chars).map((c) => ({
        aliases: [toId(c.name), c.tag, c.id],
        url: `${base}/${c.icon}`,
        label: c.name,
      }));
    },
  },
};

async function download(url: string, dest: string) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // 차단 페이지(HTML) 등이 이미지 대신 오는 경우를 걸러내고, 형식과 상관없이 PNG로 저장
  const png = await sharp(buf).png().toBuffer();
  await writeFile(dest, png);
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    for (let i = next++; i < items.length; i = next++) await fn(items[i] as T);
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--"));
  const targets = gameIndex.map((g) => g.id).filter((id) => !only.length || only.includes(id));
  if (only.length && !targets.length) throw new Error(`알 수 없는 게임: ${only.join(", ")}`);

  let failed = false;
  for (const gameId of targets) {
    const game = getGame(gameId);
    const source = SOURCES[gameId];
    if (!game) continue;
    if (!source) {
      console.log(`- ${gameId}: 소스 없음, 건너뜀 (games/images/${gameId}/ 에 직접 넣기)`);
      continue;
    }

    const entries = await source.list();
    const outDir = join(SRC_DIR, gameId);
    await mkdir(outDir, { recursive: true });

    const overrides = OVERRIDES[gameId] ?? {};
    const used = new Set<Entry>();
    const jobs: { id: string; entry: Entry }[] = [];
    const unmatched: string[] = [];
    let skipped = 0;
    for (const c of game.characters) {
      const want = overrides[c.id] ?? c.id;
      const entry = entries.find((e) => e.aliases.includes(want));
      if (!entry) {
        unmatched.push(c.id);
        continue;
      }
      used.add(entry);
      if (!force && existsSync(join(outDir, `${c.id}.png`))) skipped++;
      else jobs.push({ id: c.id, entry });
    }

    const errors: string[] = [];
    await pool(jobs, CONCURRENCY, async ({ id, entry }) => {
      try {
        await download(entry.url, join(outDir, `${id}.png`));
      } catch (e) {
        errors.push(`${id} (${entry.url}): ${(e as Error).message}`);
      }
    });

    console.log(
      `✓ ${gameId} [${source.name}]: ${jobs.length - errors.length}장 받음, ${skipped}장 이미 있음`,
    );
    if (errors.length) {
      failed = true;
      for (const e of errors) console.log(`  ✗ ${e}`);
    }
    if (unmatched.length)
      console.log(`  소스에 없음 (${unmatched.length}, 직접 넣기): ${unmatched.join(", ")}`);
    const usedLabels = new Set([...used].map((e) => e.label));
    const extra = [
      ...new Set(
        entries.map((e) => e.label).filter((l) => !usedLabels.has(l) && !l.includes("{")), // {NICKNAME} = 주인공 변형
      ),
    ];
    if (extra.length) console.log(`  소스에만 있음 (새 캐릭터일 수 있음): ${extra.join(", ")}`);
  }
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
