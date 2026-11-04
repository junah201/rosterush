const IGNORED = /[\s·・•‧∙\-‐–—_.,:;'’"!?()[\]（）「」&＆★☆]/gu;

/** 가타카나(ァ~ヶ)를 히라가나로 변환 */
function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/**
 * 라틴 문자의 악센트 제거 (ú → u, ö → o).
 * 일본어 탁점(゛)도 결합 문자라서 전체 문자열에 NFD를 적용하면 안 되므로 라틴 범위에만 적용한다.
 */
function stripLatinAccents(s: string): string {
  return s.replace(/[À-ɏ]/g, (ch) => ch.normalize("NFD").replace(/[̀-ͯ]/g, ""));
}

/**
 * 정답 판정용 정규화.
 * NFKC → 소문자 → 라틴 악센트 제거 → 공백·구두점·기호 제거 → 가타카나를 히라가나로.
 * 장음 기호(ー)는 유지한다.
 */
export function normalize(input: string): string {
  return toHiragana(stripLatinAccents(input.normalize("NFKC").toLowerCase()).replace(IGNORED, ""));
}
