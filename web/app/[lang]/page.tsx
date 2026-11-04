import { rosterAt } from "@rosterush/core";
import { games } from "@rosterush/games";
import Link from "next/link";
import { isLang, t } from "@/lib/i18n";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) return null;
  const d = t(lang);

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl">{d.tagline}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/${lang}/${g.id}/`}
            className="shadow-sticker rounded-2xl border-2 border-black bg-white p-5 transition-transform hover:-rotate-1"
          >
            <div className="font-heading text-xl">{g.name[lang]}</div>
            <div className="text-muted-foreground mt-1 text-sm font-bold">
              {rosterAt(g).length}
              {d.characters}
            </div>
            <span className="bg-sun shadow-sticker-sm mt-4 inline-block rounded-full border-2 border-black px-4 py-1 text-sm font-bold">
              {d.play}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
