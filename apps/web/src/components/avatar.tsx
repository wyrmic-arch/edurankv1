"use client";

import { tierFor } from "@edurank/shared";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  frameColor?: string | null;
  size?: number;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Minimal avatar — initials in a 1px-bordered square, no glow. */
export function Avatar({ name, avatarUrl, frameColor, size = 40 }: AvatarProps) {
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const ring = frameColor ? { boxShadow: `inset 0 0 0 2px ${frameColor}` } : undefined;
  return (
    <div
      className="relative flex items-center justify-center bg-paper border border-ink overflow-hidden shrink-0"
      style={{ width: size, height: size, ...ring }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : (
        <span className="font-mono text-ink" style={{ fontSize: size * 0.34 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

export function TierChip({ totalEarned }: { totalEarned: number }) {
  const tier = tierFor(totalEarned);
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-label px-2 py-0.5 border"
      style={{ color: tier.color, borderColor: tier.color }}
    >
      {tier.label}
    </span>
  );
}