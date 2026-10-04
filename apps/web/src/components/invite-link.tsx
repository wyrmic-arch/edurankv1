"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

function joinUrl(code: string, origin: string): string {
  return `${origin}/join?code=${code}`;
}

/** Full shareable invite link with a copy button. */
export function InviteLink({ code }: { code: string }) {
  const [origin, setOrigin] = useState("https://edurank.co.za");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const link = joinUrl(code, origin);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — user can select the text */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="font-mono text-[12px] bg-oil border border-cinder px-2.5 py-1.5 truncate max-w-[320px] text-ghost">
        {link}
      </code>
      <button onClick={copy} className="btn-ghost !text-[10px] inline-flex items-center gap-1.5">
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "COPIED" : "COPY LINK"}
      </button>
    </div>
  );
}

/** Compact "copy link" button for list rows. */
export function CopyLinkButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://edurank.co.za";
    try {
      await navigator.clipboard.writeText(joinUrl(code, origin));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }
  return (
    <button onClick={copy} className="font-mono text-[10px] uppercase tracking-label text-ghost hover:text-accent inline-flex items-center gap-1">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "COPIED" : "LINK"}
    </button>
  );
}
