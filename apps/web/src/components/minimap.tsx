"use client";

import { useRouter } from "next/navigation";
import { CITY_VIEWBOX, DISTRICTS, MARKERS, WATER_POINTS } from "./map-data";

/** GTA-style minimap — docked in a corner once you're inside the city. */
export function MiniMap({ active }: { active?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/map")}
      className="hidden md:block fixed bottom-4 left-4 z-40 w-[210px] border border-line clip-hud bg-void/80 backdrop-blur-sm hover:border-volt/50 transition-colors group"
      aria-label="Open city map"
      title="Back to the city map"
    >
      <svg viewBox={`0 0 ${CITY_VIEWBOX.w} ${CITY_VIEWBOX.h}`} className="w-full block">
        <rect width="100%" height="100%" fill="#0A0E14" />
        <polygon points={WATER_POINTS} fill="#0D1622" />
        {DISTRICTS.map((d) => {
          const isActive = d.id === active;
          return (
            <polygon
              key={d.id}
              points={d.points}
              fill={d.color}
              fillOpacity={isActive ? 0.35 : 0.08}
              stroke={d.color}
              strokeOpacity={isActive ? 1 : 0.35}
              strokeWidth={isActive ? 6 : 3}
            />
          );
        })}
        {MARKERS.map((m) => (
          <circle key={m.id} cx={m.x} cy={m.y} r="14" fill={m.color} fillOpacity="0.9" />
        ))}
      </svg>
      <div className="flex items-center justify-between px-2 py-1 border-t border-line">
        <span className="hud-label !text-[9px]">MZANSI CITY</span>
        <span className="hud-label !text-[9px] text-volt opacity-0 group-hover:opacity-100 transition-opacity">
          OPEN MAP
        </span>
      </div>
    </button>
  );
}
