import { randomBytes, type ScryptOptions, scrypt, timingSafeEqual } from "node:crypto";

/**
 * 댓글 비밀번호 해시 (PHC 문자열 형식).
 *
 *   $scrypt$ln=14,r=8,p=1$<salt b64url>$<hash b64url>
 *
 * 검증에 필요한 값(비용 ln = log2 N, 블록 크기 r, 병렬도 p, salt, 해시 길이)을 모두 문자열에 남긴다.
 * 그래서 나중에 비용을 올리거나 알고리즘을 바꿔도(새 접두어 추가) 이미 저장된 해시는 적힌 값으로 그대로 검증된다.
 * 바꿀 때는 아래 PARAMS만 고치면 되고, 예전 형식을 읽는 코드는 지우지 않는다.
 */
type Params = { ln: number; r: number; p: number };

/** 새로 만드는 해시의 설정 */
const PARAMS: Params = { ln: 14, r: 8, p: 1 };
const SALT_LEN = 16;
const KEY_LEN = 32;

/** 저장된 문자열에서 읽은 값이 터무니없을 때 거부할 범위 (메모리·CPU 폭주 방지) */
const LIMITS = { ln: [10, 20], r: [1, 32], p: [1, 16], key: [16, 64] } as const;
const within = (v: number, [lo, hi]: readonly [number, number]) =>
  Number.isInteger(v) && v >= lo && v <= hi;

function derive(password: string, salt: Buffer, keyLen: number, { ln, r, p }: Params) {
  const N = 2 ** ln;
  // scrypt 메모리 ≈ 128 * N * r 바이트. 여유를 두고 두 배까지 허용
  const opts: ScryptOptions = { N, r, p, maxmem: 2 * 128 * N * r };
  return new Promise<Buffer>((resolve, reject) => {
    // NFC: 같은 글자를 조합형/완성형으로 입력해도 같은 비밀번호로 본다 (이 규칙도 바꾸면 안 됨)
    scrypt(password.normalize("NFC"), salt, keyLen, opts, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const key = await derive(password, salt, KEY_LEN, PARAMS);
  const { ln, r, p } = PARAMS;
  return `$scrypt$ln=${ln},r=${r},p=${p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

const SCRYPT_RE = /^\$scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([\w-]+)\$([\w-]+)$/;

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const m = SCRYPT_RE.exec(stored);
  if (!m) return false;
  const params = { ln: Number(m[1]), r: Number(m[2]), p: Number(m[3]) };
  const salt = Buffer.from(m[4] as string, "base64url");
  const expected = Buffer.from(m[5] as string, "base64url");
  if (
    !within(params.ln, LIMITS.ln) ||
    !within(params.r, LIMITS.r) ||
    !within(params.p, LIMITS.p) ||
    !within(expected.length, LIMITS.key) ||
    salt.length === 0
  )
    return false;
  const key = await derive(password, salt, expected.length, params);
  return timingSafeEqual(key, expected);
}
