import type { Lang } from "@rosterush/core";

/**
 * 정책 문서(이용약관, 개인정보 처리방침)가 같이 쓰는 타입과 값.
 * 화면은 app/[lang]/(policy)/_components/policy.tsx가 그린다.
 */

/** 운영자이자 개인정보 보호책임자 */
export const OPERATOR = "@junah201";

/** 문의처 */
export const CONTACT_EMAIL = "junah.dev+rosterush@gmail.com";

export type Ymd = { y: number; m: number; d: number };

export type PolicySection = {
  title: string;
  /** 글머리표 목록 */
  items: string[];
  /** 목록 아래 링크 (언어 뒤 경로, 예: `/privacy/`) */
  link?: { path: string; label: string };
};

export type PolicyDoc = {
  title: string;
  description: string;
  /** 시행일 */
  effective: Ymd;
  intro: string;
  summaryTitle: string;
  summary: string[];
  /** 요약 아래 강조해서 보여줄 안내 */
  notice: string;
  sections: PolicySection[];
  contact: { title: string; person: string; email: string };
};

/** 언어별 시행일 표기 */
export function formatEffective(lang: Lang, { y, m, d }: Ymd): string {
  switch (lang) {
    case "ko":
      return `${y}년 ${m}월 ${d}일부터 적용`;
    case "ja":
      return `${y}年${m}月${d}日施行`;
    case "en": {
      const date = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
      return `Effective ${date}`;
    }
  }
}
