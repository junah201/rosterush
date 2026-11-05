/** 정책 문서(이용약관, 개인정보 처리방침)를 같은 스티커 카드에 담는다 */
export default function PolicyLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <article className="shadow-sticker mx-auto max-w-3xl rounded-2xl border-2 border-black bg-white p-6 sm:p-10">
      {children}
    </article>
  );
}
