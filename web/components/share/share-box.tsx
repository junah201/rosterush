"use client";

import { useEffect, useState } from "react";
import { ApiRequestError, postShare } from "@/lib/api";
import type { Dict } from "@/lib/i18n";
import { loadNickname, NICKNAME_MAX, saveNickname } from "@/lib/nickname";
import { CopyLink } from "./copy-link";

type State =
  | { s: "idle" }
  | { s: "sending" }
  | { s: "done"; url: string }
  | { s: "failed"; expired: boolean };

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
      const expired = err instanceof ApiRequestError && err.code === "RESULT_NOT_FOUND";
      setState({ s: "failed", expired });
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
          <button
            type="submit"
            disabled={state.s === "sending"}
            className="bg-sun w-full rounded-xl border-2 border-black py-2.5 font-black shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
          >
            {state.s === "sending" ? d.makingLink : d.makeLink}
          </button>
          {state.s === "failed" && (
            <p className="text-center text-xs font-bold text-[#c2405b]" role="alert">
              {state.expired ? d.shareExpired : d.shareFailed}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
