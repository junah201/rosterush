import type { Lang } from "@rosterush/core";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CONTACT_EMAIL, formatEffective, OPERATOR, type PolicyDoc } from "@/lib/policy/common";
import { localizedMeta } from "@/lib/seo";

/** 정책 문서의 메타데이터. path는 언어 뒤 경로 (예: `/terms/`) */
export const policyMeta = (lang: Lang, path: string, doc: PolicyDoc): Metadata =>
  localizedMeta(lang, path, { title: `${doc.title} | Rosterush`, description: doc.description });

const list = "mt-3 list-disc space-y-2 pl-5 leading-relaxed";

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className={list}>
      {items.map((it) => (
        <li key={it}>{it}</li>
      ))}
    </ul>
  );
}

/** 문서 각 섹션 (제목은 h2) */
export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-heading text-xl">{title}</h2>
      {children}
    </section>
  );
}

/**
 * 정책 문서 한 편: 제목·시행일·소개 → 한눈에 보기 → 안내 → (children) → 섹션들 → 문의처.
 * children에는 문서마다 다른 내용(예: 개인정보 처리방침의 '저장하는 정보' 카드)을 넣는다.
 */
export function PolicyDocument({
  lang,
  doc,
  children,
}: {
  lang: Lang;
  doc: PolicyDoc;
  children?: ReactNode;
}) {
  return (
    <>
      <h1 className="font-heading text-3xl">{doc.title}</h1>
      <p className="text-muted-foreground mt-2 text-sm font-bold">
        {formatEffective(lang, doc.effective)}
      </p>
      <p className="mt-6 leading-relaxed">{doc.intro}</p>

      <section className="bg-sun shadow-sticker-sm mt-6 rounded-xl border-2 border-black p-5">
        <h2 className="font-heading text-lg">{doc.summaryTitle}</h2>
        <Bullets items={doc.summary} />
      </section>

      <p className="border-brand bg-paper mt-4 rounded-xl border-2 p-4 leading-relaxed font-bold">
        {doc.notice}
      </p>

      {children}

      {doc.sections.map((s) => (
        <PolicySection key={s.title} title={s.title}>
          <Bullets items={s.items} />
          {s.link && (
            <Link
              href={`/${lang}${s.link.path}`}
              className="text-brand mt-3 inline-block font-bold underline"
            >
              {s.link.label}
            </Link>
          )}
        </PolicySection>
      ))}

      <PolicySection title={doc.contact.title}>
        <ul className={list}>
          <li>
            {doc.contact.person}: <span className="font-bold">{OPERATOR}</span>
          </li>
          <li>
            {doc.contact.email}:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand font-bold underline">
              {CONTACT_EMAIL}
            </a>
          </li>
        </ul>
      </PolicySection>
    </>
  );
}
