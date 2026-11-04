import { groupCharacters, LANGS } from "@rosterush/core";
import { games, getGame } from "@rosterush/games";
import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { isLang } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = () =>
  LANGS.flatMap((lang) => games.map((g) => ({ lang, game: g.id })));

export default async function GamePage({ params }: PageProps<"/[lang]/[game]">) {
  const { lang, game: gameId } = await params;
  const game = getGame(gameId);
  if (!isLang(lang) || !game) notFound();

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="shadow-sticker rounded-2xl border-2 border-black bg-white p-5">
        <h1 className="font-heading mb-4 text-2xl">{game.name[lang]}</h1>
        {groupCharacters(game).map(({ group, characters }) => (
          <div key={group?.id ?? "all"} className="mb-5">
            {group && (
              <span
                className="mb-2 inline-block rounded-md border-2 border-black px-2 py-0.5 text-xs font-black"
                style={{ background: group.color ?? "#fff" }}
              >
                {group.name[lang]}
              </span>
            )}
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
              {characters.map((c) => (
                <div
                  key={c.id}
                  className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-[#9aa3b5] bg-[#f6f7fa] text-lg font-black text-[#c3cad8]"
                >
                  ?
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <aside className="space-y-4">
        <div className="bg-brand shadow-sticker rounded-2xl border-2 border-black p-5 text-white">
          <div className="font-heading text-5xl tabular-nums">10:00</div>
        </div>
        <div className="shadow-sticker rounded-2xl border-2 border-black bg-white p-4">
          <Input
            className="h-12 rounded-xl border-2 border-black text-lg font-bold"
            placeholder="…"
          />
        </div>
      </aside>
    </section>
  );
}
