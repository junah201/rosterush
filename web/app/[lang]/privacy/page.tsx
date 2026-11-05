import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { CONTACT_EMAIL, EFFECTIVE_DATE, PRIVACY_OFFICER, privacy } from "@/lib/privacy";
import { localizedMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const p = privacy[lang];
  return localizedMeta(lang, "/privacy/", {
    title: `${p.title} | Rosterush`,
    description: p.description,
  });
}

const list = "mt-3 list-disc space-y-2 pl-5 leading-relaxed";

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const p = privacy[lang];

  return (
    <article className="shadow-sticker mx-auto max-w-3xl rounded-2xl border-2 border-black bg-white p-6 sm:p-10">
      <h1 className="font-heading text-3xl">{p.title}</h1>
      <p className="text-muted-foreground mt-2 text-sm font-bold">{p.effective(EFFECTIVE_DATE)}</p>
      <p className="mt-6 leading-relaxed">{p.intro}</p>

      <section className="bg-sun shadow-sticker-sm mt-6 rounded-xl border-2 border-black p-5">
        <h2 className="font-heading text-lg">{p.summaryTitle}</h2>
        <ul className={list}>
          {p.summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <p className="border-brand bg-paper mt-4 rounded-xl border-2 p-4 leading-relaxed font-bold">
        {p.publicNotice}
      </p>

      <section className="mt-10">
        <h2 className="font-heading text-xl">{p.dataTitle}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{p.dataNote}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {p.data.map((d) => (
            <div key={d.name} className="rounded-xl border-2 border-black p-4">
              <h3 className="font-heading">{d.name}</h3>
              <dl className="mt-2 space-y-2 text-sm leading-relaxed">
                {(["what", "why", "keep"] as const).map((k) => (
                  <div key={k}>
                    <dt className="text-muted-foreground text-xs font-bold">{p.dataLabels[k]}</dt>
                    <dd>{d[k]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      {p.sections.map((s) => (
        <section key={s.title} className="mt-10">
          <h2 className="font-heading text-xl">{s.title}</h2>
          <ul className={list}>
            {s.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-10">
        <h2 className="font-heading text-xl">{p.contact.title}</h2>
        <ul className={list}>
          <li>
            {p.contact.officer}: <span className="font-bold">{PRIVACY_OFFICER}</span>
          </li>
          <li>
            {p.contact.email}:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand font-bold underline">
              {CONTACT_EMAIL}
            </a>
          </li>
        </ul>
      </section>
    </article>
  );
}
