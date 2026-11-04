const IGNORED = /[\s·・\-‐–—_.,:;'’"!?()[\]（）「」]/gu;

/** 가타카나(ァ~ヶ)를 히라가나로 변환 */
function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/**
 * 정답 판정용 정규화.
 * NFKC → 소문자 → 공백·구두점 제거 → 가타카나를 히라가나로.
 * 장음 기호(ー)는 유지한다.
 */
export function normalize(input: string): string {
  return toHiragana(input.normalize("NFKC").toLowerCase().replace(IGNORED, ""));
}
