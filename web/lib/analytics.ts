import { sendGAEvent } from "@next/third-parties/google";
import type { Difficulty, EndReason, Lang } from "@rosterush/core";

/**
 * Google Tag(GA4) 측정 ID. 빌드할 때 넣으며(scripts/deploy-web.sh), 비어 있으면 태그를 아예 싣지 않는다.
 * 무엇을 보내는지는 개인정보 처리방침(lib/policy/privacy.ts)과 맞출 것.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

type GameParams = { game: string; lang: Lang; difficulty: Difficulty };

type Events = {
  /** 첫 정답으로 타이머가 시작됨 */
  game_start: GameParams;
  /** 한 판이 끝남 */
  game_end: GameParams & {
    end_reason: EndReason;
    /** 맞힌 캐릭터 수 */
    solved: number;
    /** 전체 캐릭터 수 */
    total: number;
    /** 걸린 시간(초) */
    seconds: number;
  };
};

/** GA4 맞춤 이벤트. 방문자 수·페이지뷰는 태그가 알아서 보낸다. */
export function track<K extends keyof Events>(name: K, params: Events[K]): void {
  if (!GA_ID) return;
  sendGAEvent("event", name, params);
}
