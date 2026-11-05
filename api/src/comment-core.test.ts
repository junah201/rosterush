import { randomBytes, scryptSync } from "node:crypto";
import { parseCommentId } from "@rosterush/core";
import { getGame } from "@rosterush/games";
import { describe, expect, it } from "vitest";
import { type CommentItem, toComment, toCommentRecord } from "./lib/comment-core";
import { hashPassword, verifyPassword } from "./lib/password";

const parent = "01JC8Z3K9QX7M2B4N6P8R0T2V4";
const child = "01JC8Z3K9QX7M2B4N6P8R0T2V5";

const item: CommentItem = {
  pk: "G#overwatch#ko",
  sk: parent,
  game: "overwatch",
  lang: "ko",
  nickname: "준아",
  pwHash: "$scrypt$ln=14,r=8,p=1$salt$hash",
  body: "9분 컷",
  status: "active",
  replyCount: 2,
  likeCount: 0,
  ipHash: "a91f",
  record: {
    shareId: "k3Fq9xZa",
    lang: "ja",
    difficulty: "normal",
    rosterVer: 1,
    endReason: "clear",
    totalMs: 252_340,
    solved: 54,
    total: 54,
  },
  createdAt: 1_762_300_000,
  editedAt: null,
};

describe("toComment", () => {
  it("비밀 필드(pwHash, ipHash)는 내보내지 않는다", () => {
    const c = toComment(item);
    expect(c).not.toHaveProperty("pwHash");
    expect(c).not.toHaveProperty("ipHash");
    expect(c).toMatchObject({
      id: `overwatch.ko.${parent}`,
      nickname: "준아",
      body: "9분 컷",
      createdAt: "2025-11-04T23:46:40.000Z",
      editedAt: null,
    });
  });
  it("답글 id에는 부모 ULID가 들어간다", () => {
    const c = toComment({ ...item, pk: `R#${parent}`, sk: child });
    expect(c.id).toBe(`overwatch.ko.${parent}.${child}`);
    expect(parseCommentId(c.id)?.parent).toBe(parent);
  });
  it("삭제된 댓글은 닉네임·본문·기록을 비운다", () => {
    const c = toComment({ ...item, status: "deleted" });
    expect(c).toMatchObject({ nickname: "", body: "", record: null, replyCount: 2 });
  });
});

describe("toCommentRecord", () => {
  it("results 원본에서 기록 요약을 만든다 (총 인원은 그 rosterVer 기준)", () => {
    const game = getGame("overwatch");
    if (!game) throw new Error("overwatch missing");
    const r = toCommentRecord(
      "k3Fq9xZa",
      { game: "overwatch", lang: "en", difficulty: "hard", ulid: parent },
      game,
      { rosterVer: 1, endReason: "giveup", totalMs: 90_000, solves: { tracer: 1000, mercy: 2000 } },
    );
    expect(r).toEqual({
      shareId: "k3Fq9xZa",
      lang: "en",
      difficulty: "hard",
      rosterVer: 1,
      endReason: "giveup",
      totalMs: 90_000,
      solved: 2,
      total: 54,
    });
  });
});

describe("password", () => {
  /** 다른 설정으로 만든 해시 (설정을 바꾼 뒤에도 예전 해시가 검증되는지 보려고) */
  const legacy = (pw: string, ln: number, r: number, p: number, keyLen: number) => {
    const salt = randomBytes(16);
    const key = scryptSync(pw, salt, keyLen, { N: 2 ** ln, r, p, maxmem: 2 * 128 * 2 ** ln * r });
    return `$scrypt$ln=${ln},r=${r},p=${p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
  };

  it("맞는 비밀번호만 통과하고, 같은 비밀번호도 매번 다른 해시가 된다", async () => {
    const h = await hashPassword("1234");
    expect(h).toMatch(/^\$scrypt\$ln=14,r=8,p=1\$[\w-]+\$[\w-]+$/);
    expect(await verifyPassword("1234", h)).toBe(true);
    expect(await verifyPassword("12345", h)).toBe(false);
    expect(await hashPassword("1234")).not.toBe(h);
  });
  it("문자열에 적힌 설정으로 검증한다 (설정을 바꿔도 예전 해시가 통과)", async () => {
    const h = legacy("pass1234", 12, 4, 2, 24);
    expect(await verifyPassword("pass1234", h)).toBe(true);
    expect(await verifyPassword("pass12345", h)).toBe(false);
  });
  it("조합형·완성형 한글을 같은 비밀번호로 본다 (NFC)", async () => {
    const h = await hashPassword("비밀");
    expect(await verifyPassword("비밀".normalize("NFD"), h)).toBe(true);
  });
  it("형식이 틀리거나 설정이 범위를 벗어난 해시는 실패", async () => {
    expect(await verifyPassword("1234", "plain")).toBe(false);
    expect(await verifyPassword("1234", "scrypt$N=16384$c2FsdA$aGFzaA")).toBe(false);
    const huge = legacy("1234", 12, 8, 1, 32).replace("ln=12", "ln=30");
    expect(await verifyPassword("1234", huge)).toBe(false);
  });
});
