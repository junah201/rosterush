import type { Dict } from "@/lib/i18n";
import type { Rank } from "@/lib/stats";

/** 순위를 보여줄 수 없을 때의 점선 카드 */
export const mutedCard =
  "shadow-sticker rounded-2xl border-2 border-dashed border-black bg-white p-4 text-center text-sm font-bold text-[#5b6577]";

/** 상위 %를 계산하지 못한 이유 문구 */
export function rankNote(rank: Exclude<Rank, { kind: "top" }>, d: Dict): string {
  switch (rank.kind) {
    case "pending":
      return d.percentilePending;
    case "rosterChanged":
      return d.rosterChanged;
    case "collecting":
      return d.collecting(rank.n, rank.min);
  }
}
