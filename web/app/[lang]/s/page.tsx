import { notFound } from "next/navigation";
import { ShareView } from "@/components/share/share-view";
import { isLang } from "@/lib/i18n";

/**
 * 공유 기록 페이지의 껍데기 ({lang}/s/index.html).
 * 실제 주소는 /s/{shareId}: API(share-page)가 이 HTML에 미리보기 메타 태그를 넣어 돌려주고,
 * 기록 내용은 클라이언트가 주소의 shareId로 /api/shares/{shareId}를 불러 그린다.
 */
export default async function SharePage({ params }: PageProps<"/[lang]/s">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <ShareView lang={lang} />;
}
