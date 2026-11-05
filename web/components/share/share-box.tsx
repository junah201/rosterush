"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiRequestError, postShare } from "@/lib/api";
import type { Dict } from "@/lib/i18n";
import { loadNickname, NICKNAME_MAX, saveNickname } from "@/lib/nickname";
import { CopyLink } from "./copy-link";

type State =
  | { s: "idle" }
  | { s: "sending" }
  | { s: "done"; url: string }
  | { s: "failed"; message: string };

/** 결과 화면: 닉네임(선택)을 받아 공유 링크를 만든다 */
export function ShareBox({ resultId, title, d }: { resultId: string; title: string; d: Dict }) {
  const [nickname, setNickname] = useState("");
  const [state, setState] = useState<State>({ s: "idle" });

  useEffect(() => setNickname(loadNickname()), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nickname.trim();
    setState({ s: "sending" });
    try {
      const { url } = await postShare({ resultId, nickname: name || undefined });
      saveNickname(name);
      setState({ s: "done", url });
    } catch (err) {
      const code = err instanceof ApiRequestError ? err.code : "";
      const message =
        code === "RESULT_NOT_FOUND"
          ? d.shareExpired
          : code === "RATE_LIMITED"
            ? d.commentErrors.RATE_LIMITED
            : d.shareFailed;
      setState({ s: "failed", message });
    }
  };

  return (
    <div className="shadow-sticker rounded-2xl border-2 border-black bg-white p-4">
      <div className="mb-3 font-black">{d.share}</div>
      {state.s === "done" ? (
        <CopyLink url={state.url} title={title} d={d} />
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={NICKNAME_MAX}
            placeholder={d.nickname}
            aria-label={d.nickname}
            disabled={state.s === "sending"}
            className="w-full rounded-xl border-2 border-black px-3 py-2 text-sm font-bold"
          />
          <Button
            type="submit"
            variant="sun"
            size="lg"
            className="w-full"
            disabled={state.s === "sending"}
          >
            {state.s === "sending" ? d.makingLink : d.makeLink}
          </Button>
          {state.s === "failed" && (
            <p className="text-center text-xs font-bold text-[#c2405b]" role="alert">
              {state.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
