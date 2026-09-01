"use client";

import { Sparkles } from "lucide-react";

/** Confident teaser shown on wallet surfaces — points economy framing. */
export function PayoutTeaser() {
  return (
    <div className="border border-gold/40 bg-gold/5 clip-hud px-4 py-3 flex items-start gap-3">
      <Sparkles className="w-4 h-4 text-gold mt-0.5 shrink-0" />
      <p className="text-sm">
        <span className="font-display uppercase tracking-wider text-gold">Real-money payouts in the works.</span>{" "}
        <span className="text-mute">Until launch day: stack PTS, take the throne, flex the frames.</span>
      </p>
    </div>
  );
}
