"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ASCII_MAP, DISTRICTS, MARKERS, type District } from "./map-data";

interface HoverState {
  x: number;
  y: number;
  title: string;
  sub: string;
}

/**
 * MZANSI CITY — character-art map.
 *
 * The map is rendered as a fixed 100x50 ASCII grid: roads are `-`/`|`/`+`,
 * districts are 2-letter codes inside bordered rectangles, water is `X`
 * down the bottom-right corner, and a handful of mission markers sit at
 * district intersections. Click anywhere inside a district to enter it.
 */
export function CityMap({
  noteCounts,
}: {
  noteCounts: Record<string, number>;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<HoverState | null>(null);

  // Build the rendered lines once per noteCounts change.
  const renderedLines = ASCII_MAP.map((line, idx) => {
    const countsLine = DISTRICTS.find((d) => Math.floor((d.y0 + d.y1) / 2) + 1 === idx);
    if (!countsLine) return line;
    const count = noteCounts[countsLine.id] ?? 0;
    const padded = ` ${String(count).padStart(2, "0")} NOTES `;
    const left = line.slice(0, countsLine.x0 + 1);
    const right = line.slice(countsLine.x0 + 1 + padded.length);
    return left + padded + right;
  });

  function pickAt(col: number, row: number): District | null {
    return DISTRICTS.find((d) => col >= d.x0 && col <= d.x1 && row >= d.y0 && row <= d.y1) ?? null;
  }

  function pickMarker(col: number, row: number) {
    return MARKERS.find((m) => m.x === col && m.y === row);
  }

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * 100);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * 50);
    const d = pickAt(col, row);
    if (d) {
      setHovered(d.id);
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title: d.name, sub: `${noteCounts[d.id] ?? 0} notes · ${d.short}` });
      return;
    }
    const m = pickMarker(col, row);
    if (m) {
      setHovered(m.id);
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title: m.label, sub: "CLICK TO OPEN" });
      return;
    }
    setHovered(null);
    setTooltip(null);
  }

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * 100);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * 50);
    const d = pickAt(col, row);
    if (d) router.push(`/district/${d.id}`);
    else {
      const m = pickMarker(col, row);
      if (m) router.push(m.href);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-paper select-none cursor-crosshair hairline"
      onMouseMove={onMove}
      onMouseLeave={() => { setHovered(null); setTooltip(null); }}
      onClick={onClick}
      role="application"
      aria-label="Mzansi City subject map"
    >
      <pre className="ascii text-ink w-full m-0 p-4 overflow-x-auto" style={{ fontSize: "clamp(6px, 1.0vw, 11px)" }}>
        {renderedLines.map((line, i) => (
          <div key={i} style={{ minHeight: "1em" }}>{line || " "}</div>
        ))}
      </pre>

      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-paper hairline px-3 py-2 text-xs"
          style={{
            left: Math.min(tooltip.x + 16, (containerRef.current?.clientWidth ?? 400) - 240),
            top: tooltip.y + 16,
          }}
        >
          <div className="font-medium">{tooltip.title}</div>
          <div className="label">{tooltip.sub}</div>
        </div>
      )}
    </div>
  );
}