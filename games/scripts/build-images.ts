/**
 * 캐릭터 원본 이미지 → 서비스용 webp(컬러 + 실루엣) 변환, 게임 JSON에 경로 기록.
 *
 * 사용: pnpm images:build [게임id...]
 *   원본: games/images/{game}/{캐릭터id}.{png|webp|jpg|jpeg|avif}  (git 제외, 투명 배경 권장)
 *   출력: web/public/img/{game}/{해시}.webp                        (git 제외, 로컬 dev에서 바로 보임)
 *   업로드: bash scripts/upload-images.sh <dev|prod>
 *
 * - 파일명은 결과물 내용의 해시 → 캐릭터 id가 드러나지 않고, 영구 캐시 가능
 * - 실루엣은 원본의 알파 채널만 남긴 별도 파일 (CSS 필터로 만들면 원본이 그대로 내려가서 정답 노출)
 * - 원본이 없는 캐릭터는 JSON의 기존 값을 건드리지 않음
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { gameIndex, getGame } from "../src/index";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SRC_DIR = join(ROOT, "games/images");
const OUT_DIR = join(ROOT, "web/public/img");
const EXTS = ["png", "webp", "jpg", "jpeg", "avif"];

/** 결과 이미지 한 변 (타일 최대 ~100px × 고해상도 화면 여유) */
const SIZE = 256;
/** 실루엣 색 (빈 타일 배경 #f6f7fa 위에서 잘 보이는 어두운 회색) */
const SILHOUETTE_RGB = [58, 65, 80] as const;

type Built = { image: string; silhouette?: string };

function hashName(buf: Buffer, charId: string): string {
  // 해시 16진수에 우연히 id(예: "ace")가 들어가면 검증에 걸리므로 소금을 바꿔 다시 뽑는다
  for (let salt = 0; ; salt++) {
    const h = createHash("sha256").update(buf).update(String(salt)).digest("hex").slice(0, 12);
    if (!h.includes(charId.toLowerCase())) return h;
  }
}

async function build(src: string, charId: string): Promise<{ full: Buffer; sil?: Buffer }> {
  // 투명도는 원본 기준으로 판단 (trim/contain 뒤에는 여백이 투명해져서 늘 투명하게 보임)
  const { isOpaque } = await sharp(src).stats();
  const resized = await sharp(src)
    .ensureAlpha()
    .trim() // 투명 여백 제거해서 캐릭터가 타일을 꽉 채우게
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = resized;
  const raw = { raw: { width: info.width, height: info.height, channels: 4 as const } };

  const full = await sharp(data, raw).webp({ quality: 82, alphaQuality: 90 }).toBuffer();

  // 실루엣: 알파만 유지, 색은 단색으로. 원본에 투명 영역이 없으면 의미가 없으므로 생략
  if (isOpaque) {
    console.warn(`  ! ${charId}: 투명 배경이 없어 실루엣 생략 (배경 제거한 PNG 권장)`);
    return { full };
  }
  const sil = Buffer.from(data);
  for (let i = 0; i < sil.length; i += 4) {
    sil[i] = SILHOUETTE_RGB[0];
    sil[i + 1] = SILHOUETTE_RGB[1];
    sil[i + 2] = SILHOUETTE_RGB[2];
  }
  return { full, sil: await sharp(sil, raw).webp({ lossless: true }).toBuffer() };
}

/** 포맷을 유지하기 위해 JSON을 텍스트로 수정: 캐릭터 블록의 "names" 앞에 image/silhouette 줄을 넣는다 */
function patchJson(text: string, charId: string, built: Built): string {
  const charsAt = text.indexOf('"characters"');
  const idAt = text.indexOf(`"id": "${charId}"`, charsAt);
  const namesAt = text.indexOf('"names"', idAt);
  if (charsAt < 0 || idAt < 0 || namesAt < 0) throw new Error(`${charId}: JSON에서 위치를 못 찾음`);

  const lineStart = text.lastIndexOf("\n", namesAt) + 1;
  const indent = text.slice(lineStart, namesAt);
  const head = text
    .slice(idAt, lineStart)
    .replace(/^[ \t]*"(image|silhouette)": "[^"]*",\r?\n/gm, "");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  let lines = `${indent}"image": "${built.image}",${eol}`;
  if (built.silhouette) lines += `${indent}"silhouette": "${built.silhouette}",${eol}`;
  return text.slice(0, idAt) + head + lines + text.slice(lineStart);
}

async function main() {
  const only = process.argv.slice(2);
  const targets = gameIndex.map((g) => g.id).filter((id) => !only.length || only.includes(id));
  if (only.length && !targets.length) throw new Error(`알 수 없는 게임: ${only.join(", ")}`);

  for (const gameId of targets) {
    const game = getGame(gameId);
    if (!game) continue;
    const jsonPath = join(ROOT, "games", `${gameId}.json`);
    let text = await readFile(jsonPath, "utf8");
    const outDir = join(OUT_DIR, gameId);
    await mkdir(outDir, { recursive: true });

    const missing: string[] = [];
    let done = 0;
    for (const c of game.characters) {
      const ext = EXTS.find((e) => existsSync(join(SRC_DIR, gameId, `${c.id}.${e}`)));
      if (!ext) {
        missing.push(c.id);
        continue;
      }
      const { full, sil } = await build(join(SRC_DIR, gameId, `${c.id}.${ext}`), c.id);
      const built: Built = { image: `${gameId}/${hashName(full, c.id)}.webp` };
      await writeFile(join(OUT_DIR, built.image), full);
      if (sil) {
        built.silhouette = `${gameId}/${hashName(sil, c.id)}.webp`;
        await writeFile(join(OUT_DIR, built.silhouette), sil);
      }
      text = patchJson(text, c.id, built);
      done++;
    }

    await writeFile(jsonPath, text);
    console.log(`✓ ${gameId}: ${done}/${game.characters.length}명 처리`);
    if (missing.length) console.log(`  원본 없음 (${missing.length}): ${missing.join(", ")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
