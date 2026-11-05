import { LANGS, type Lang } from "@rosterush/core";
import type { Metadata } from "next";
import { fontClassName, fontStyle } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 · Rosterush",
  robots: { index: false },
};

/**
 * 어떤 경로에도 맞지 않는 주소의 404 페이지 (정적 export의 404.html).
 * 하나의 HTML이 모든 언어를 맡으므로 세 언어를 다 그려 두고,
 * 첫 페인트 전에 인라인 스크립트가 주소의 언어 > lang 쿠키 > 브라우저 언어 순으로 골라 나머지를 숨긴다.
 * /s/{shareId}의 기록이 없을 때도 API가 이 HTML을 돌려준다.
 */
const copy = {
  ko: {
    title: "도감에 없는 페이지예요",
    body: "주소가 바뀌었거나 사라진 페이지예요. 다른 게임에 도전해 보세요!",
    home: "홈으로",
  },
  ja: {
    title: "図鑑にないページです",
    body: "アドレスが変わったか、削除されたページです。ほかのゲームに挑戦してみよう！",
    home: "ホームへ",
  },
  en: {
    title: "This page isn't in the roster",
    body: "It may have moved or no longer exists. Try another game instead!",
    home: "Go home",
  },
} satisfies Record<Lang, unknown>;

const detectLang = `(function(){var L=${JSON.stringify(LANGS)};var p=location.pathname.split("/")[1];var l=L.indexOf(p)>=0?p:null;if(!l){var m=document.cookie.match(/(?:^|; )lang=([^;]*)/);if(m&&L.indexOf(m[1])>=0)l=m[1];}if(!l){var n=navigator.languages||[navigator.language||""];for(var i=0;i<n.length&&!l;i++){var c=String(n[i]).slice(0,2).toLowerCase();if(L.indexOf(c)>=0)l=c;}}l=l||"en";var h=document.documentElement;h.lang=l;h.dataset.lang=l;})();`;

/** Tailwind가 클래스를 찾을 수 있게 언어별로 풀어 쓴다 */
const activeLang: Record<Lang, string> = {
  ko: "in-data-[lang=ko]:bg-black in-data-[lang=ko]:text-white",
  ja: "in-data-[lang=ja]:bg-black in-data-[lang=ja]:text-white",
  en: "in-data-[lang=en]:bg-black in-data-[lang=en]:text-white",
};

const langCss = LANGS.map(
  (l) => `html[data-lang="${l}"] [data-l]:not([data-l="${l}"]){display:none}`,
).join("");

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      data-lang="en"
      className={fontClassName}
      style={fontStyle}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 고정 문자열, 첫 페인트 전 언어 선택 */}
        <script dangerouslySetInnerHTML={{ __html: detectLang }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 고정 문자열 */}
        <style dangerouslySetInnerHTML={{ __html: langCss }} />
      </head>
      <body className="min-h-dvh">
        <header className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5 sm:gap-4">
          {LANGS.map((l) => (
            <a
              key={l}
              data-l={l}
              href={`/${l}/`}
              className="bg-brand font-heading shadow-sticker -rotate-2 border-2 border-black px-2.5 py-1 text-xl whitespace-nowrap text-white sm:px-3 sm:text-2xl"
            >
              ROSTERUSH
            </a>
          ))}
          <nav className="ml-auto flex shrink-0 overflow-hidden rounded-full border-2 border-black bg-white text-xs font-bold">
            {LANGS.map((l) => (
              <a
                key={l}
                href={`/${l}/`}
                className={`px-2.5 py-1 uppercase sm:px-3 ${activeLang[l]}`}
              >
                {l}
              </a>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 pb-20">
          <section className="flex flex-col items-center pt-10 text-center sm:pt-16">
            <div className="relative">
              <div className="font-heading shadow-sticker bg-sun rotate-2 rounded-3xl border-2 border-black px-8 py-4 text-7xl sm:text-8xl">
                404
              </div>
              <span className="bg-brand shadow-sticker-sm absolute -top-4 -right-6 -rotate-12 rounded-full border-2 border-black px-3 py-1 text-xs font-black text-white">
                ???
              </span>
            </div>
            {LANGS.map((l) => (
              <div key={l} data-l={l} lang={l} className="mt-10 space-y-3">
                <h1 className="font-heading text-3xl">{copy[l].title}</h1>
                <p className="text-muted-foreground text-sm font-bold">{copy[l].body}</p>
                <a
                  href={`/${l}/`}
                  className="bg-sun shadow-sticker-sm mt-4 inline-block rounded-full border-2 border-black px-5 py-1.5 text-sm font-bold transition-transform hover:-rotate-2"
                >
                  {copy[l].home}
                </a>
              </div>
            ))}
          </section>
        </main>
      </body>
    </html>
  );
}
