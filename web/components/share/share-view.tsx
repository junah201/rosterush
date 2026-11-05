"use client";

import { type Lang, SHARE_ID_RE, type ShareView as Share } from "@rosterush/core";
import { getGame } from "@rosterush/games";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, getShare } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { type Dict, t } from "@/lib/i18n";
import { CopyLink } from "./copy-link";
import { SharePercentile } from "./share-percentile";

type State = { s: "loading" } | { s: "ready"; share: Share } | { s: "missing" } | { s: "failed" };

/** 주소에서 shareId: /s/{id} (배포), 없으면 ?id= (개발 중 껍데기를 직접 열 때) */
function readShareId(): string | null {
  const fromPath = /\/s\/([^/]+)\/?$/.exec(location.pathname)?.[1];
  const id = fromPath ?? new URLSearchParams(location.search).get("id");
  return id && SHARE_ID_RE.test(id) ? id : null;
}

const card = "shadow-sticker rounded-2xl border-2 border-black p-5";

export function ShareView({ lang }: { lang: Lang }) {
  const d = t(lang);
  const [state, setState] = useState<State>({ s: "loading" });

  const load = useCallback(async () => {
    const id = readShareId();
    if (!id) return setState({ s: "missing" });
    setState({ s: "loading" });
    try {
      setState({ s: "ready", share: await getShare(id) });
    } catch (e) {
      const missing = e instanceof ApiRequestError && e.code === "SHARE_NOT_FOUND";
      setState({ s: missing ? "missing" : "failed" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mx-auto max-w-md space-y-4">
      {state.s === "loading" && <div className={`${card} h-48 animate-pulse bg-white`} />}
      {state.s === "missing" && <Notice text={d.shareNotFound} lang={lang} d={d} />}
      {state.s === "failed" && (
        <Notice text={d.shareLoadFailed} lang={lang} d={d}>
          <button type="button" className="underline" onClick={() => void load()}>
            {d.reload}
          </button>
        </Notice>
      )}
      {state.s === "ready" && <ShareCard share={state.share} lang={lang} d={d} />}
    </section>
  );
}

function Notice({
  text,
  lang,
  d,
  children,
}: {
  text: string;
  lang: Lang;
  d: Dict;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${card} space-y-3 bg-white text-center font-bold`}>
      <p>{text}</p>
      {children}
      <Link href={`/${lang}/`} className="block text-sm text-[#5b6577] underline">
        {d.tryIt}
      </Link>
    </div>
  );
}

function ShareCard({ share, lang, d }: { share: Share; lang: Lang; d: Dict }) {
  const game = getGame(share.game);
  const gameName = game?.name[lang] ?? share.game;
  const clear = share.endReason === "clear";
  const date = new Date(share.createdAt).toLocaleDateString(lang);
  const title = `${gameName} · ${d.end[share.endReason]} ${formatTime(share.totalMs)}`;
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${location.origin}/s/${share.shareId}`);
  }, [share.shareId]);

  // API가 넣은 <title>을 Next가 하이드레이션 때 레이아웃 기본값으로 되돌리므로 다시 맞춘다
  useEffect(() => {
    document.title = `${title} | Rosterush`;
  }, [title]);

  return (
    <>
      <div className={`${card} rr-pop ${clear ? "bg-sun" : "bg-white"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-heading text-xl">{gameName}</span>
          <span className="rounded-md border-2 border-black bg-[#7ee0c3] px-2 text-xs font-bold">
            {d.difficulty[share.difficulty]}
          </span>
        </div>
        <div className="mt-1 text-sm font-bold">
          {share.nickname ? d.recordOf(share.nickname) : d.anonymousRecord}
        </div>

        <div className="mt-4 inline-block -rotate-3 rounded-full border-2 border-black bg-white px-3 py-0.5 text-sm font-black">
          {d.end[share.endReason]}
        </div>
        <div className="mt-3 text-xs font-bold text-[#5b6577]">{d.record}</div>
        <div className="font-heading text-4xl tabular-nums">{formatTime(share.totalMs)}</div>
        <div className="mt-1 text-lg font-black">
          {share.solved} / {share.total}
        </div>
        <div className="mt-3 text-xs font-bold text-[#5b6577]">{d.sharedOn(date)}</div>
      </div>

      <SharePercentile share={share} d={d} />

      <Link
        href={`/${lang}/${share.game}/`}
        className="bg-brand block w-full rounded-xl border-2 border-black py-3 text-center font-black text-white shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        {d.tryIt}
      </Link>

      {url && (
        <div className={`${card} bg-white`}>
          <CopyLink url={url} title={title} d={d} />
        </div>
      )}
    </>
  );
}
