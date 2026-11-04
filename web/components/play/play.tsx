"use client";

import { DIFFICULTIES, type GameDef, groupCharacters, type Lang } from "@rosterush/core";
import { useState } from "react";
import { formatClock } from "@/lib/format";
import { t } from "@/lib/i18n";
import { AnswerInput } from "./answer-input";
import { ResultPanel } from "./result-panel";
import { usePlay } from "./use-play";

const TILTS = [-3, 2, -1, 3, 0, -2];

export function PlayView({ game, lang }: { game: GameDef; lang: Lang }) {
  const d = t(lang);
  const play = usePlay(game, lang);
  const groupings = game.groupings ?? [];
  const [groupingId, setGroupingId] = useState(groupings[0]?.id);
  const groups = groupCharacters(game, groupingId);
  const solvedCount = Object.keys(play.solves).length;
  const ended = play.phase === "ended";
  let k = 0;

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* 캐릭터 도감 */}
      <div className="shadow-sticker rounded-2xl border-2 border-black bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl">{game.name[lang]}</h1>
          <span className="rounded-md border-2 border-black bg-[#7ee0c3] px-2 text-xs font-bold">
            {d.difficulty[play.difficulty]}
          </span>
          {groupings.length > 1 && (
            <div className="flex overflow-hidden rounded-full border-2 border-black text-xs font-bold">
              {groupings.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => setGroupingId(g.id)}
                  className={`px-3 py-1 ${g.id === groupingId ? "bg-black text-white" : "bg-white"}`}
                >
                  {g.name[lang]}
                </button>
              ))}
            </div>
          )}
          <span className="ml-auto text-sm font-bold">
            {solvedCount}/{play.roster.length} {d.found}
          </span>
        </div>

        {groups.map(({ group, characters }) => (
          <div key={group?.id ?? "all"} className="mb-5">
            {group && (
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-md border-2 border-black px-2 py-0.5 text-xs font-black"
                  style={{ background: group.color ?? "#fff" }}
                >
                  {group.name[lang]}
                </span>
                <span className="text-xs font-bold text-[#5b6577]">
                  {characters.filter((c) => play.solves[c.id] !== undefined).length} /{" "}
                  {characters.length}
                </span>
              </div>
            )}
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
              {characters.map((c) => {
                const name = c.names[lang].full[0] ?? c.id;
                const found = play.solves[c.id] !== undefined;
                const tilt = TILTS[k++ % TILTS.length];
                if (found) {
                  return (
                    <div
                      key={c.id}
                      className={`shadow-sticker-sm flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-black p-1 text-center ${play.lastHit?.id === c.id ? "rr-pop" : ""}`}
                      style={{ background: group?.color ?? "#ffd23f", rotate: `${tilt}deg` }}
                    >
                      <div className="mb-1 grid h-7 w-7 place-items-center rounded-full border-2 border-black bg-white text-xs font-black">
                        {name[0]}
                      </div>
                      <span className="w-full truncate text-[10px] leading-tight font-bold">
                        {name}
                      </span>
                    </div>
                  );
                }
                if (ended) {
                  // 끝난 뒤에는 놓친 캐릭터 공개
                  return (
                    <div
                      key={c.id}
                      className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-[#ff8fa3] bg-[#fff0f3] p-1 text-center"
                    >
                      <span className="w-full truncate text-[10px] font-bold text-[#c2405b]">
                        {name}
                      </span>
                    </div>
                  );
                }
                return (
                  <div
                    key={c.id}
                    className="relative grid aspect-square place-items-center overflow-hidden rounded-xl border-2 border-dashed border-[#9aa3b5] bg-[#f6f7fa] text-lg font-black text-[#c3cad8]"
                  >
                    {play.difficulty === "easy" && c.image ? (
                      // 이미지 자체가 미리 블러 처리되어 업로드됨
                      // biome-ignore lint/performance/noImgElement: 정적 export, 최적화 불필요
                      <img src={`/img/${c.image}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "?"
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 사이드 패널 */}
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        {ended && play.result ? (
          <ResultPanel
            game={game}
            lang={lang}
            d={d}
            difficulty={play.difficulty}
            result={play.result}
            onRetry={play.reset}
          />
        ) : (
          <>
            <div className="bg-brand shadow-sticker rounded-2xl border-2 border-black p-5 text-white">
              <div className="text-xs font-bold opacity-70">{d.timeLeft}</div>
              <div className="font-heading text-5xl tabular-nums">
                {formatClock(play.remaining)}
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-black bg-white">
                <div
                  className="bg-sun h-full"
                  style={{ width: `${(solvedCount / play.roster.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="shadow-sticker space-y-3 rounded-2xl border-2 border-black bg-white p-4">
              <AnswerInput
                disabled={ended}
                placeholder={d.placeholder}
                onFirstInput={play.start}
                onAnswer={play.answer}
              />
              <div className="text-brand h-5 text-sm font-black">
                {play.phase === "ready" ? (
                  <span className="font-bold text-[#5b6577]">{d.startHint}</span>
                ) : play.lastHit ? (
                  <span key={play.lastHit.at} className="rr-pop inline-block">
                    {`${game.characters.find((c) => c.id === play.lastHit?.id)?.names[lang].full[0] ?? ""} ✦`}
                  </span>
                ) : null}
              </div>
              <div className="flex gap-1.5 text-xs">
                {DIFFICULTIES.map((diff) => (
                  <button
                    type="button"
                    key={diff}
                    disabled={play.phase !== "ready"}
                    onClick={() => play.setDifficulty(diff)}
                    title={d.difficultyHint[diff]}
                    className={`flex-1 rounded-lg border-2 border-black py-1 text-center font-bold disabled:cursor-not-allowed ${diff === play.difficulty ? "bg-black text-white" : "bg-white disabled:opacity-40"}`}
                  >
                    {d.difficulty[diff]}
                  </button>
                ))}
              </div>
              <p className="text-center text-[11px] text-[#5b6577]">
                {d.difficultyHint[play.difficulty]}
              </p>
              <button
                type="button"
                onClick={play.giveUp}
                disabled={play.phase !== "playing"}
                className="w-full rounded-xl border-2 border-black bg-white py-2 text-sm font-bold disabled:opacity-40"
              >
                {d.giveUp}
              </button>
            </div>
          </>
        )}
      </aside>
    </section>
  );
}
