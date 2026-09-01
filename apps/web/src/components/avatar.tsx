"use client";

import { tierFor } from "@edurank/shared";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  frameColor?: string | null;
  size?: number;
}

const PALETTE = ["#A6FF3F", "#43D9FF", "#FFC24B", "#FF6B9D", "#2DD4BF", "#FF8A3D"];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic HUD avatar: initials on a dark plate with an accent notch. */
export function Avatar({ name, avatarUrl, frameColor, size = 40 }: AvatarProps) {
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const accent = PALETTE[hashCode(name) % PALETTE.length];
  const inner = (
    <div
      className="relative flex items-center justify-center bg-surface-3 border border-line overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : (
        <>
          <span className="font-display text-ink" style={{ fontSize: size * 0.38 }}>
            {initials}
          </span>
          <span className="absolute bottom-0 left-0 right-0" style={{ height: size * 0.12, background: accent, opacity: 0.9 }} />
        </>
      )}
    </div>
  );
  if (!frameColor) return <div className="clip-hud-sm">{inner}</div>;
  return (
    <div
      className="p-[2px] clip-hud-sm"
      style={{
        background: frameColor,
        boxShadow: `0 0 14px ${frameColor}55`,
      }}
    >
      <div className="p-[2px] bg-void clip-hud-sm">{inner}</div>
    </div>
  );
}

export function TierChip({ totalEarned }: { totalEarned: number }) {
  const tier = tierFor(totalEarned);
  return (
    <span
      className="font-mono text-[10px] tracking-hud uppercase px-2 py-0.5 border"
      style={{ color: tier.color, borderColor: `${tier.color}55`, background: `${tier.color}11` }}
    >
      {tier.label}
    </span>
  );
}
