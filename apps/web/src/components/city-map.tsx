"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Zap, ShoppingBag, ArrowUpFromLine, type LucideIcon } from "lucide-react";
import { CITY_VIEWBOX, DISTRICTS, MARKERS, ROADS, WATER_POINTS, type District, type MapMarker } from "./map-data";

const GLYPHS: Record<MapMarker["glyph"], LucideIcon> = {
  crown: Crown,
  bolt: Zap,
  bag: ShoppingBag,
  upload: ArrowUpFromLine,
};

interface TooltipState {
  x: number;
  y: number;
  title: string;
  sub: string;
  color: string;
}

export function CityMap({
  noteCounts,
  skin,
}: {
  noteCounts: Record<string, number>;
  skin?: { accent?: string; road?: string } | null;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const districtById = useMemo(() => new Map(DISTRICTS.map((d) => [d.id, d])), []);

  function onMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x: nx * -10, y: ny * -8 });
  }

  function hoverDistrict(d: District, e: React.MouseEvent) {
    setHovered(d.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        title: d.name.toUpperCase(),
        sub: `${noteCounts[d.id] ?? 0} notes · ${d.short}`,
        color: d.color,
      });
    }
  }

  function markerHover(m: MapMarker, e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title: m.label, sub: "CLICK TO OPEN", color: m.color });
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#0A0E14] cursor-crosshair select-none"
      onMouseMove={onMove}
      onMouseLeave={() => {
        setTooltip(null);
        setHovered(null);
      }}
      role="application"
      aria-label="Mzansi City subject map"
    >
      <div
        className="absolute inset-[-20px] transition-transform duration-200 ease-out"
        style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
      >
        <svg
          viewBox={`0 0 ${CITY_VIEWBOX.w} ${CITY_VIEWBOX.h}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="mapgrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0H0V50" fill="none" stroke="#151C28" strokeWidth="1" />
            </pattern>
          </defs>

          {/* base land */}
          <rect width="100%" height="100%" fill="#0B0F15" />
          <rect width="100%" height="100%" fill="url(#mapgrid)" />

          {/* water */}
          <polygon points={WATER_POINTS} fill="#0D1622" stroke="#1E3247" strokeWidth="2" />
          <g opacity="0.35">
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M ${980 + i * 60} ${900 - i * 70} q 40 -12 80 0 q 40 12 80 0`}
                stroke="#22405E"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* roads */}
          <g>
            {ROADS.map((r, i) => (
              <line
                key={i}
                x1={r.from[0]}
                y1={r.from[1]}
                x2={r.to[0]}
                y2={r.to[1]}
                stroke={skin?.road ?? "#232C3A"}
                strokeWidth="6"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* districts */}
          {DISTRICTS.map((d) => {
            const isHovered = hovered === d.id;
            return (
              <g
                key={d.id}
                onMouseMove={(e) => hoverDistrict(d, e)}
                onMouseEnter={(e) => hoverDistrict(d, e)}
                onMouseLeave={() => {
                  setHovered(null);
                  setTooltip(null);
                }}
                onClick={() => router.push(`/district/${d.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/district/${d.id}`);
                  }
                }}
                tabIndex={0}
                focusable="true"
                style={{
                  cursor: "pointer",
                  transformOrigin: `${d.cx}px ${d.cy}px`,
                  transform: isHovered ? "scale(1.02)" : "scale(1)",
                  transition: "transform 180ms ease",
                  outline: "none",
                }}
                role="link"
                aria-label={`${d.name} district — ${noteCounts[d.id] ?? 0} notes`}
              >
                <polygon
                  points={d.points}
                  fill={d.color}
                  fillOpacity={isHovered ? 0.16 : 0.06}
                  stroke={isHovered ? d.color : `${d.color}88`}
                  strokeWidth={isHovered ? 3.5 : 2}
                  style={
                    isHovered
                      ? { filter: `drop-shadow(0 0 10px ${d.color})` }
                      : undefined
                  }
                />
                <text
                  x={d.cx}
                  y={d.cy - 6}
                  textAnchor="middle"
                  fontSize="21"
                  letterSpacing="4"
                  fontWeight="700"
                  fill="#EAF0F6"
                  fillOpacity={isHovered ? 1 : 0.85}
                  style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase", pointerEvents: "none" }}
                >
                  {d.name.toUpperCase()}
                </text>
                <text
                  x={d.cx}
                  y={d.cy + 18}
                  textAnchor="middle"
                  fontSize="13"
                  letterSpacing="3"
                  fill={d.color}
                  style={{ fontFamily: "var(--font-mono)", pointerEvents: "none" }}
                >
                  {(noteCounts[d.id] ?? 0).toString().padStart(2, "0")} NOTES · {d.short}
                </text>
              </g>
            );
          })}

          {/* mission markers */}
          {MARKERS.map((m) => {
            const Glyph = GLYPHS[m.glyph];
            return (
              <g
                key={m.id}
                onMouseEnter={(e) => markerHover(m, e)}
                onMouseMove={(e) => markerHover(m, e)}
                onMouseLeave={() => setTooltip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(m.href);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(m.href);
                  }
                }}
                tabIndex={0}
                focusable="true"
                style={{ cursor: "pointer", outline: "none" }}
                role="link"
                aria-label={m.label}
              >
                <circle cx={m.x} cy={m.y} r="26" fill={m.color} fillOpacity="0.12" className="animate-pulseRing" style={{ transformOrigin: `${m.x}px ${m.y}px` }} />
                <circle cx={m.x} cy={m.y} r="15" fill="#0A0E14" stroke={m.color} strokeWidth="2.5" />
                <g transform={`translate(${m.x - 8}, ${m.y - 8}) scale(0.66)`} style={{ pointerEvents: "none", color: m.color }}>
                  <Glyph size={24} strokeWidth={2.4} />
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* GTA-style tooltip HUD */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none clip-hud-sm border bg-void/90 px-3 py-2 backdrop-blur-sm"
          style={{
            left: Math.min(tooltip.x + 16, (containerRef.current?.clientWidth ?? 400) - 220),
            top: tooltip.y + 16,
            borderColor: tooltip.color,
            boxShadow: `0 0 18px ${tooltip.color}33`,
          }}
        >
          <div className="font-display uppercase tracking-wider text-sm" style={{ color: tooltip.color }}>
            {tooltip.title}
          </div>
          <div className="hud-label mt-0.5">{tooltip.sub}</div>
        </div>
      )}
    </div>
  );
}
