"use client";

import type { Comment, CommentCreateRequest } from "@rosterush/core";
import { useEffect, useId, useState } from "react";
import { formatTime } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { loadNickname, NICKNAME_MAX, saveNickname } from "@/lib/nickname";
import { type LocalRecord, loadRecords, onRecordsChange } from "@/lib/records";
import { errorText, inputCls } from "./util";

/** 기록은 results TTL(30일) 안에서만 첨부할 수 있다 */
const ATTACH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const BODY_MAX = 500;

type Props = {
  gameId: string;
  d: Dict;
  placeholder: string;
  submit: (req: CommentCreateRequest) => Promise<Comment>;
  onPosted: (c: Comment) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

/** 원댓글·답글 작성 폼 (닉네임 + 비밀번호, 내 기록 첨부 선택) */
export function CommentForm({
  gameId,
  d,
  placeholder,
  submit,
  onPosted,
  onCancel,
  autoFocus,
}: Props) {
  const ids = useId();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [body, setBody] = useState("");
  const [records, setRecords] = useState<LocalRecord[]>([]);
  const [resultId, setResultId] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNickname(loadNickname());
  }, []);

  // 첨부할 수 있는 기록: 폼이 뜬 뒤에 끝낸 판도 바로 고를 수 있게 기록이 저장될 때마다 다시 읽는다
  useEffect(() => {
    const load = () => {
      const since = Date.now() - ATTACH_WINDOW_MS;
      setRecords(loadRecords().filter((r) => r.game === gameId && r.at > since));
    };
    load();
    return onRecordsChange(load);
  }, [gameId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const c = await submit({
        nickname: nickname.trim(),
        password,
        body,
        ...(resultId ? { resultId } : {}),
      });
      saveNickname(nickname.trim());
      setBody("");
      setPassword("");
      setResultId("");
      onPosted(c);
    } catch (err) {
      setError(errorText(d, err));
    } finally {
      setSending(false);
    }
  };

  const ready = nickname.trim() && password.length >= 4 && body.trim();

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={BODY_MAX}
        rows={3}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={sending}
        // biome-ignore lint/a11y/noAutofocus: 답글 달기를 누른 직후 바로 쓰게
        autoFocus={autoFocus}
        className={`${inputCls} resize-y`}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={NICKNAME_MAX}
          placeholder={d.nicknameLabel}
          aria-label={d.nicknameLabel}
          autoComplete="nickname"
          disabled={sending}
          className={inputCls}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={32}
          placeholder={d.passwordLabel}
          aria-label={d.passwordLabel}
          aria-describedby={`${ids}-pw`}
          autoComplete="new-password"
          disabled={sending}
          className={inputCls}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {records.length > 0 && (
          <select
            value={resultId}
            onChange={(e) => setResultId(e.target.value)}
            aria-label={d.attachRecord}
            disabled={sending}
            className={`${inputCls} basis-full sm:w-auto sm:min-w-0 sm:flex-1 sm:basis-auto`}
          >
            <option value="">
              {d.attachRecord}: {d.noAttach}
            </option>
            {records.map((r) => (
              <option key={r.resultId} value={r.resultId}>
                {d.difficulty[r.difficulty]} · {d.end[r.endReason]} {formatTime(r.totalMs)} ·{" "}
                {r.solved}/{r.total}
              </option>
            ))}
          </select>
        )}
        <span id={`${ids}-pw`} className="text-xs font-bold text-[#5b6577]">
          {d.passwordHint}
        </span>
        <span className="ml-auto text-xs font-bold text-[#8a93a5] tabular-nums">
          {body.length}/{BODY_MAX}
        </span>
      </div>
      {error && (
        <p className="text-xs font-bold text-[#c2405b]" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-black"
          >
            {d.cancel}
          </button>
        )}
        <button
          type="submit"
          disabled={sending || !ready}
          className="bg-brand rounded-xl border-2 border-black px-5 py-2 text-sm font-black text-white shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
        >
          {sending ? d.posting : d.post}
        </button>
      </div>
    </form>
  );
}
