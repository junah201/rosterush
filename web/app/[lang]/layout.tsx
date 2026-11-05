import { LANGS } from "@rosterush/core";
import type { Metadata } from "next";
import { Black_Han_Sans, Dela_Gothic_One, Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang, t } from "@/lib/i18n";
import { SITE_ORIGIN } from "@/lib/seo";
import "../globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-sans",
  weight: ["400", "700", "900"],
  preload: false,
});
const dela = Dela_Gothic_One({ variable: "--font-dela", weight: "400", preload: false });
const hanSans = Black_Han_Sans({ variable: "--font-hansans", weight: "400", preload: false });

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
    <html
      lang={lang}
      className={`${sans.variable} ${dela.variable} ${hanSans.variable} antialiased`}
      style={{ "--font-display": "var(--font-dela), var(--font-hansans)" } as React.CSSProperties}
    >
      <body className="min-h-dvh">
        <header className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-5">
          <Link
            href={`/${lang}/`}
            className="bg-brand font-heading shadow-sticker -rotate-2 border-2 border-black px-3 py-1 text-2xl text-white"
          >
            ROSTERUSH
          </Link>
          <nav className="ml-auto flex overflow-hidden rounded-full border-2 border-black bg-white text-xs font-bold">
            {LANGS.map((l) => (
              <Link
                key={l}
                href={`/${l}/`}
                className={`px-3 py-1 uppercase ${l === lang ? "bg-black text-white" : ""}`}
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
