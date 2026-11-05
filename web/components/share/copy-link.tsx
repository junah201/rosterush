"use client";

import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";

const btn =
  "rounded-xl border-2 border-black px-3 py-2 text-sm font-black shadow-[2px_2px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

/** 링크 표시 + 복사 + (지원하면) 기기 공유 시트 */
export function CopyLink({ url, title, d }: { url: string; title: string; d: Dict }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // 클립보드를 못 쓰면 입력칸을 선택해 직접 복사하게 한다
      document.querySelector<HTMLInputElement>("[data-share-url]")?.select();
    }
  };

  const share = () => navigator.share({ title, url }).catch(() => {});

  return (
    <div className="space-y-2">
      <input
        data-share-url
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={d.copyLink}
        className="w-full rounded-xl border-2 border-black bg-[#f6f7fb] px-3 py-2 text-sm font-bold"
      />
      <div className="flex gap-2">
        <button type="button" onClick={copy} className={`${btn} flex-1 bg-white`}>
          {copied ? `✓ ${d.copied}` : d.copyLink}
        </button>
        {canShare && (
          <button type="button" onClick={share} className={`${btn} bg-sun`}>
            {d.shareNative}
          </button>
        )}
      </div>
    </div>
  );
}
