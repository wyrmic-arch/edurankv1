"use client";

import { Sparkles } from "lucide-react";

/** Confident teaser shown on the profile — points economy framing. */
export function PayoutTeaser() {
  return (
    <div className="hairline px-4 py-3 flex items-start gap-3">
      <Sparkles className="w-4 h-4 text-mark mt-0.5 shrink-0" />
      <p className="text-[13px]">
        <span className="font-medium">Real-money payouts in the works.</span>{" "}
        <span className="text-mute">Until launch day: stack PTS, take the throne, flex the frames.</span>
      </p>
    </div>
  );
}