import { LANGS, rosterAt } from "@rosterush/core";
import { games, getGame } from "@rosterush/games";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/comments/comment-section";
import { PlayView } from "@/components/play/play";
import { isLang, t } from "@/lib/i18n";
import { localizedMeta } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () =>
  LANGS.flatMap((lang) => games.map((g) => ({ lang, game: g.id })));

export async function generateMetadata({ params }: PageProps<"/[lang]/[game]">): Promise<Metadata> {
  const { lang, game: gameId } = await params;
  const game = getGame(gameId);
  if (!isLang(lang) || !game) return {};
  const { seo } = t(lang);
  const name = game.name[lang];
  return localizedMeta(lang, `/${game.id}/`, {
    title: seo.gameTitle(name),
    description: seo.gameDescription(name, rosterAt(game).length),
  });
}

export default async function GamePage({ params }: PageProps<"/[lang]/[game]">) {
  const { lang, game: gameId } = await params;
  const game = getGame(gameId);
  if (!isLang(lang) || !game) notFound();

  return (
    <>
      <PlayView game={game} lang={lang} />
      <CommentSection gameId={game.id} lang={lang} />
    </>
  );
}
