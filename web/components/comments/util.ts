import type { Lang } from "@rosterush/core";
import { ApiRequestError } from "@/lib/api";
import type { Dict } from "@/lib/i18n";

/** API 에러 코드 → 화면 문구 */
export function errorText(d: Dict, e: unknown): string {
  const code = e instanceof ApiRequestError ? e.code : "";
  return (d.commentErrors as Record<string, string>)[code] ?? d.commentErrors.default;
}

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
];

/** "3분 전" 같은 상대 시각. 1주가 넘으면 날짜 */
export function timeAgo(iso: string, lang: Lang, now = Date.now()): string {
  const then = new Date(iso).getTime();
  let v = Math.max(0, Math.round((now - then) / 1000));
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  for (const [unit, size] of STEPS) {
    if (v < size) return rtf.format(-v, unit);
    v = Math.floor(v / size);
  }
  return new Date(iso).toLocaleDateString(lang);
}

export const inputCls =
  "w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-bold placeholder:font-medium placeholder:text-[#8a93a5] disabled:opacity-60";
