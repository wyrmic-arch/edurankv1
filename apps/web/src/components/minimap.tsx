"use client";

import { useRouter } from "next/navigation";
import { MAP_W, MAP_H, SA_OUTLINE } from "./school-map-data";

/** Tiny South Africa overview shown on inner pages. */
export function MiniMap({ active }: { active?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/map")}
      className="hidden md:block fixed bottom-6 left-6 z-40 w-[220px] hairline bg-paper hover:bg-ink hover:text-paper transition-colors group"
      aria-label="Open the school map"
      title="Back to the school map"
    >
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="block w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={SA_OUTLINE.join(" ")}
          fill="none"
          fillRule="evenodd"
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
        <circle
          cx={280}
          cy={400}
          r={3}
          fill="currentColor"
          fillOpacity={active ? 1 : 0.6}
        />
      </svg>
      <div className="flex items-center justify-between px-2 py-1 border-t border-ruleSoft">
        <span className="label !text-[9px]">EDURANK</span>
        <span className="label !text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">OPEN MAP</span>
      </div>
    </button>
  );
}
