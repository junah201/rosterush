"use client";

import type { Comment, Lang } from "@rosterush/core";
import { useCallback, useEffect, useState } from "react";
import { createComment, listComments } from "@/lib/api";
import { t } from "@/lib/i18n";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import { errorText } from "./util";

type State = { s: "loading" } | { s: "ready" } | { s: "failed"; error: string };

/** 게임 페이지 아래 댓글 (게임·언어별) */
export function CommentSection({ gameId, lang }: { gameId: string; lang: Lang }) {
  const d = t(lang);
  const [items, setItems] = useState<Comment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<State>({ s: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (from: string | null) => {
      if (from) setLoadingMore(true);
      else setState({ s: "loading" });
      try {
        const page = await listComments(gameId, lang, from);
        setItems((prev) => [...(from ? prev : []), ...page.items]);
        setCursor(page.nextCursor);
        setState({ s: "ready" });
      } catch (e) {
        setState({ s: "failed", error: errorText(d, e) });
      } finally {
        setLoadingMore(false);
      }
    },
    [gameId, lang, d],
  );

  useEffect(() => {
    void load(null);
  }, [load]);

  const replace = (id: string) => (next: Comment | null) =>
    setItems((prev) => prev.flatMap((c) => (c.id !== id ? [c] : next ? [next] : [])));

  return (
    <section
      aria-labelledby="comments-title"
      className="shadow-sticker mt-8 rounded-2xl border-2 border-black bg-white p-5"
    >
      <h2 id="comments-title" className="font-heading mb-4 text-xl">
        {d.comments}
      </h2>

      <CommentForm
        gameId={gameId}
        d={d}
        placeholder={d.commentPlaceholder}
        submit={(req) => createComment(gameId, lang, req)}
        onPosted={(c) => setItems((prev) => [c, ...prev])}
      />

      <div className="mt-6 space-y-5">
        {state.s === "loading" && <p className="text-sm font-bold text-[#8a93a5]">…</p>}
        {state.s === "failed" && (
          <p className="text-sm font-bold text-[#c2405b]">
            {d.commentsLoadFailed} ·{" "}
            <button type="button" className="underline" onClick={() => void load(null)}>
              {d.reload}
            </button>
          </p>
        )}
        {state.s === "ready" && items.length === 0 && (
          <p className="text-sm font-bold text-[#8a93a5]">{d.noComments}</p>
        )}
        {items.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            gameId={gameId}
            lang={lang}
            d={d}
            onChange={replace(c.id)}
          />
        ))}
        {cursor && state.s === "ready" && (
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => void load(cursor)}
            className="w-full rounded-xl border-2 border-black bg-white py-2 text-sm font-black disabled:opacity-60"
          >
            {loadingMore ? "…" : d.moreComments}
          </button>
        )}
      </div>
    </section>
  );
}
