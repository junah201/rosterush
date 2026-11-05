import { LANGS } from "@rosterush/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fontClassName, fontStyle } from "@/lib/fonts";
import { isLang, t } from "@/lib/i18n";
import { SITE_ORIGIN } from "@/lib/seo";
import "../globals.css";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

/** 페이지가 따로 정하지 않을 때의 기본값 (공유 기록 껍데기 등). hreflang은 페이지마다 넣는다. */
export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: "Rosterush",
    description: t(lang).seo.siteDescription,
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html lang={lang} className={fontClassName} style={fontStyle}>
      <body className="min-h-dvh">
        <header className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5 sm:gap-4">
          <Link
            href={`/${lang}/`}
            className="bg-brand font-heading shadow-sticker -rotate-2 border-2 border-black px-2.5 py-1 text-xl whitespace-nowrap text-white sm:px-3 sm:text-2xl"
          >
            ROSTERUSH
          </Link>
          <nav className="ml-auto flex shrink-0 overflow-hidden rounded-full border-2 border-black bg-white text-xs font-bold">
            {LANGS.map((l) => (
              <Link
                key={l}
                href={`/${l}/`}
                className={`px-2.5 py-1 uppercase sm:px-3 ${l === lang ? "bg-black text-white" : ""}`}
              >
                {l}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 pb-20">{children}</main>
      </body>
    </html>
  );
}
