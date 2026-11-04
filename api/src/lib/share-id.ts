import { randomInt } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** 8자 base62 (62^8 ≈ 218조). 충돌은 저장 시 조건부 쓰기로 감지해 재시도한다 */
export function newShareId(length = 8): string {
  let id = "";
  for (let i = 0; i < length; i++) id += ALPHABET[randomInt(ALPHABET.length)];
  return id;
}
