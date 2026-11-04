import { LANGS } from "@rosterush/core";
import { games, getGame } from "@rosterush/games";
import { notFound } from "next/navigation";
import { PlayView } from "@/components/play/play";
import { isLang, t } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = () =>
  LANGS.flatMap((lang) => games.map((g) => ({ lang, game: g.id })));

export default async function GamePage({ params }: PageProps<"/[lang]/[game]">) {
  const { lang, game: gameId } = await params;
  const game = getGame(gameId);
  if (!isLang(lang) || !game) notFound();

  return <PlayView game={game} lang={lang} d={t(lang)} />;
}
