"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/lib/i18n";

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
        <Button variant="white" className="flex-1" onClick={copy}>
          {copied ? `✓ ${d.copied}` : d.copyLink}
        </Button>
        {canShare && (
          <Button variant="sun" onClick={share}>
            {d.shareNative}
          </Button>
        )}
      </div>
    </div>
  );
}
