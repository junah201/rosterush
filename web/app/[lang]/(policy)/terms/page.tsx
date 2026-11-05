import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { terms } from "@/lib/policy/terms";
import { PolicyDocument, policyMeta } from "../_components/policy";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return policyMeta(lang, "/terms/", terms[lang]);
}

export default async function TermsPage({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <PolicyDocument lang={lang} doc={terms[lang]} />;
}
