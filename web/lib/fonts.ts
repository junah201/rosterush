import { Black_Han_Sans, Dela_Gothic_One, Noto_Sans_KR } from "next/font/google";

const sans = Noto_Sans_KR({
  variable: "--font-sans",
  weight: ["400", "700", "900"],
  preload: false,
});
const dela = Dela_Gothic_One({ variable: "--font-dela", weight: "400", preload: false });
const hanSans = Black_Han_Sans({ variable: "--font-hansans", weight: "400", preload: false });

/** `<html>`에 붙이는 폰트 변수와 공통 클래스 */
export const fontClassName = `${sans.variable} ${dela.variable} ${hanSans.variable} antialiased`;
export const fontStyle = {
  "--font-display": "var(--font-dela), var(--font-hansans)",
} as React.CSSProperties;
