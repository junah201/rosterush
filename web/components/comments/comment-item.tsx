"use client";

import type { Comment, Lang } from "@rosterush/core";
import { useState } from "react";
import { createReply, deleteComment, listReplies, updateComment } from "@/lib/api";
import type { Dict } from "@/lib/i18n";
import { CommentForm } from "./comment-form";
import { RecordChip } from "./record-chip";
import { errorText, inputCls, smallBtn, timeAgo } from "./util";

type Props = {
  comment: Comment;
  gameId: string;
  lang: Lang;
  d: Dict;
  isReply?: boolean;
  /** 수정·삭제 결과를 부모 목록에 반영 (null = 목록에서 빼기) */
  onChange: (c: Comment | null) => void;
};

type Mode = { m: "view" } | { m: "edit" } | { m: "delete" };

export function CommentItem({ comment: c, gameId, lang, d, isReply, onChange }: Props) {
  const [mode, setMode] = useState<Mode>({ m: "view" });
  const active = c.status === "active";

  return (
    <article className={isReply ? "border-l-2 border-black/15 pl-3" : ""}>
      {active ? (
        <>
          <header className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-black">{c.nickname}</span>
            <time dateTime={c.createdAt} className="text-xs font-bold text-[#8a93a5]">
              {timeAgo(c.createdAt, lang)}
            </time>
            {c.editedAt && <span className="text-xs font-bold text-[#8a93a5]">· {d.edited}</span>}
          </header>
          {mode.m === "edit" ? (
            <EditBox comment={c} d={d} onDone={onChange} close={() => setMode({ m: "view" })} />
          ) : (
            <p className="mt-1 text-sm break-words whitespace-pre-wrap">{c.body}</p>
          )}
          {c.record && mode.m !== "edit" && (
            <RecordChip game={gameId} lang={lang} record={c.record} d={d} />
          )}
          {mode.m === "delete" && (
            <DeleteBox comment={c} d={d} onDone={onChange} close={() => setMode({ m: "view" })} />
          )}
          {mode.m === "view" && (
            <div className="mt-1.5 flex gap-3 text-xs font-bold text-[#5b6577]">
              <button
                type="button"
                className="hover:underline"
                onClick={() => setMode({ m: "edit" })}
              >
                {d.edit}
              </button>
              <button
                type="button"
                className="hover:underline"
                onClick={() => setMode({ m: "delete" })}
              >
                {d.remove}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm font-bold text-[#8a93a5]">{d.deletedComment}</p>
      )}

      {!isReply && (
        <Replies parent={c} gameId={gameId} lang={lang} d={d} onParentChange={onChange} />
      )}
    </article>
  );
}

function EditBox({
  comment,
  d,
  onDone,
  close,
}: {
  comment: Comment;
  d: Dict;
  onDone: (c: Comment) => void;
  close: () => void;
}) {
  const [body, setBody] = useState(comment.body);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onDone(await updateComment(comment.id, { password, body }));
      close();
    } catch (err) {
      setError(errorText(d, err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-2 space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={500}
        rows={3}
        aria-label={d.edit}
        disabled={busy}
        className={`${inputCls} resize-y`}
      />
      <PasswordRow
        d={d}
        password={password}
        setPassword={setPassword}
        busy={busy}
        error={error}
        submitLabel={d.save}
        disabled={!body.trim() || password.length < 4}
        close={close}
      />
    </form>
  );
}

function DeleteBox({
  comment,
  d,
  onDone,
  close,
}: {
  comment: Comment;
  d: Dict;
  onDone: (c: Comment | null) => void;
  close: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await deleteComment(comment.id, { password });
      onDone(
        r.removed === "soft"
          ? { ...comment, status: "deleted", nickname: "", body: "", record: null }
          : null,
      );
    } catch (err) {
      setError(errorText(d, err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={remove} className="mt-2">
      <PasswordRow
        d={d}
        password={password}
        setPassword={setPassword}
        busy={busy}
        error={error}
        submitLabel={d.confirmRemove}
        danger
        disabled={password.length < 4}
        close={close}
      />
    </form>
  );
}

function PasswordRow(p: {
  d: Dict;
  password: string;
  setPassword: (v: string) => void;
  busy: boolean;
  error: string | null;
  submitLabel: string;
  danger?: boolean;
  disabled: boolean;
  close: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="password"
          value={p.password}
          onChange={(e) => p.setPassword(e.target.value)}
          maxLength={32}
          placeholder={p.d.passwordLabel}
          aria-label={p.d.passwordLabel}
          autoComplete="current-password"
          disabled={p.busy}
          // biome-ignore lint/a11y/noAutofocus: 수정·삭제를 누르면 바로 비밀번호를 입력하게
          autoFocus
          className={`${inputCls} w-40 flex-none py-1.5`}
        />
        <button
          type="submit"
          disabled={p.busy || p.disabled}
          className={`${smallBtn} ${p.danger ? "bg-[#ff8fa3]" : "bg-sun"}`}
        >
          {p.submitLabel}
        </button>
        <button type="button" onClick={p.close} className={`${smallBtn} bg-white`}>
          {p.d.cancel}
        </button>
      </div>
      {p.error && (
        <p className="text-xs font-bold text-[#c2405b]" role="alert">
          {p.error}
        </p>
      )}
    </div>
  );
}

/** 원댓글 아래 답글: "답글 N개 보기"를 누르면 오래된 순으로 불러온다 */
function Replies({
  parent,
  gameId,
  lang,
  d,
  onParentChange,
}: {
  parent: Comment;
  gameId: string;
  lang: Lang;
  d: Dict;
  onParentChange: (c: Comment | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [items, setItems] = useState<Comment[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (from: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const page = await listReplies(parent.id, from);
      setItems((prev) => [...(from ? (prev ?? []) : []), ...page.items]);
      setCursor(page.nextCursor);
    } catch (err) {
      setError(errorText(d, err));
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (!open && items === null) void load(null);
    setOpen(!open);
  };

  const setCount = (replyCount: number) => onParentChange({ ...parent, replyCount });

  const onReplyChange = (id: string) => (next: Comment | null) => {
    setItems((prev) => (prev ?? []).flatMap((r) => (r.id !== id ? [r] : next ? [next] : [])));
    if (next) return;
    const replyCount = parent.replyCount - 1;
    // 삭제된 원댓글의 마지막 답글이 지워지면 서버에서 원댓글도 지워진다
    if (parent.status !== "active" && replyCount <= 0) onParentChange(null);
    else setCount(replyCount);
  };

  const active = parent.status === "active";
  if (!active && parent.replyCount === 0) return null;

  return (
    <div className="mt-2 space-y-3">
      <div className="flex gap-3 text-xs font-black">
        {parent.replyCount > 0 && (
          <button type="button" onClick={toggle} className="text-brand hover:underline">
            {open ? d.hideReplies : d.showReplies(parent.replyCount)}
          </button>
        )}
        {active && !writing && (
          <button
            type="button"
            onClick={() => setWriting(true)}
            className="text-[#5b6577] hover:underline"
          >
            {d.reply}
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-3">
          {items?.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              gameId={gameId}
              lang={lang}
              d={d}
              isReply
              onChange={onReplyChange(r.id)}
            />
          ))}
          {loading && <p className="text-xs font-bold text-[#8a93a5]">…</p>}
          {error && <p className="text-xs font-bold text-[#c2405b]">{error}</p>}
          {cursor && !loading && (
            <button
              type="button"
              onClick={() => void load(cursor)}
              className="text-brand text-xs font-black hover:underline"
            >
              {d.moreReplies}
            </button>
          )}
        </div>
      )}

      {writing && (
        <div className="border-l-2 border-black/15 pl-3">
          <CommentForm
            gameId={gameId}
            d={d}
            placeholder={d.replyPlaceholder}
            submit={(req) => createReply(parent.id, req)}
            onPosted={(r) => {
              setWriting(false);
              setOpen(true);
              setCount(parent.replyCount + 1);
              // 이미 불러온 목록이면 끝에 붙이고, 아니면 지금 불러온다 (방금 쓴 답글 포함)
              if (items !== null) setItems([...items, r]);
              else void load(null);
            }}
            onCancel={() => setWriting(false)}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
