"use client";

import { useEffect, useState } from "react";

/**
 * AsciiLogo — the wordmark rendered as monospace glyphs with a subtle
 * per-character animation: every letter breathes on a staggered phase, and
 * occasionally one or two letters tick to the ember accent and back.
 *
 * Reduced-motion users get a static wordmark. The first render is
 * deterministic (all letters neutral) so it hydrates cleanly.
 */
export function AsciiLogo({
  text = "EDURANK",
  size = "md",
  className = "",
}: {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [hot, setHot] = useState<ReadonlySet<number>>(() => new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number;
    const tick = () => {
      const count = Math.random() < 0.4 ? 2 : 1;
      const next = new Set<number>();
      while (next.size < count) next.add(Math.floor(Math.random() * text.length));
      setHot(next);
      timer = window.setTimeout(tick, 900 + Math.random() * 1500);
    };
    timer = window.setTimeout(tick, 800);
    return () => window.clearTimeout(timer);
  }, [text]);

  const sizeClass =
    size === "lg" ? "text-4xl sm:text-5xl" : size === "sm" ? "text-base sm:text-lg" : "text-xl sm:text-2xl";

  return (
    <span
      role="img"
      aria-label={text}
      className={`inline-flex items-center font-mono font-bold tracking-[0.22em] leading-none ${sizeClass} ${className}`}
    >
      {text.split("").map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          aria-hidden="true"
          className={`transition-colors duration-500 ${hot.has(i) ? "text-accent" : "text-ash"}`}
          style={{ animation: `logo-breathe 3.4s ease-in-out ${(i * 0.17).toFixed(2)}s infinite` }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
