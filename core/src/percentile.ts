import { TIME_LIMIT_MS } from "./types";

/** 1초 단위 히스토그램 칸 수 (0~600초) */
export const HIST_BINS = TIME_LIMIT_MS / 1000;

export type ClearTime = {
  n: number;
  min: number | null;
  max: number | null;
  /** 99개: p[0]=p1 … p[98]=p99 (ms) */
  p: number[] | null;
};

export function binOf(ms: number): number {
  return Math.min(HIST_BINS - 1, Math.max(0, Math.floor(ms / 1000)));
}

/** 히스토그램 → 백분위표. 칸 안에서는 선형 보간, 10ms 단위 반올림 */
export function histToClearTime(bins: number[], minSample: number): ClearTime {
  const n = bins.reduce((a, b) => a + b, 0);
  if (n < minSample || n === 0) return { n, min: null, max: null, p: null };

  const first = bins.findIndex((b) => b > 0);
  const last = bins.findLastIndex((b) => b > 0);
  const round10 = (ms: number) => Math.round(ms / 10) * 10;

  const p: number[] = [];
  let cum = 0;
  let i = 0;
  for (let k = 1; k <= 99; k++) {
    const target = (k / 100) * n;
    while (i < bins.length && cum + (bins[i] ?? 0) < target) cum += bins[i++] ?? 0;
    const inBin = bins[i] ?? 1;
    p.push(round10((i + (target - cum) / inBin) * 1000));
  }
  return { n, min: first * 1000, max: (last + 1) * 1000, p };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** "상위 X%"의 X (작을수록 잘함). 데이터가 부족하면 null */
export function topPercent(ms: number, s: ClearTime): number | null {
  if (!s.p || s.min === null || s.max === null) return null;
  if (ms <= s.min) return 0.1;
  if (ms >= s.max) return 99.9;
  const pts = [s.min, ...s.p, s.max];
  const i = pts.findIndex((v) => v >= ms);
  const lo = pts[i - 1] ?? s.min;
  const hi = pts[i] ?? s.max;
  const t = (ms - lo) / (hi - lo || 1);
  return clamp(Math.round((i - 1 + t) * 10) / 10, 0.1, 99.9);
}
