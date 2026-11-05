import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { privacy } from "@/lib/policy/privacy";
import { PolicyDocument, PolicySection, policyMeta } from "../_components/policy";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return policyMeta(lang, "/privacy/", privacy[lang]);
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const p = privacy[lang];

  return (
    <PolicyDocument lang={lang} doc={p}>
      <PolicySection title={p.dataTitle}>
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
      </PolicySection>
    </PolicyDocument>
  );
}
