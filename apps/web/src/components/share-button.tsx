"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { shareOrCopy } from "@/lib/share";

export function ShareButton({
  title,
  text,
  url,
  label = "SHARE",
  className,
}: {
  title: string;
  text: string;
  url?: string;
  label?: string;
  className?: string;
}) {
  const [flash, setFlash] = useState<string | null>(null);

  async function go() {
    const result = await shareOrCopy({ title, text, url });
    if (result === "copied") {
      setFlash("COPIED");
      setTimeout(() => setFlash(null), 1600);
    }
  }

  return (
    <button type="button" onClick={() => void go()} className={className ?? "btn-ghost !text-[10px]"}>
      {flash ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />} {flash ?? label}
    </button>
  );
}
