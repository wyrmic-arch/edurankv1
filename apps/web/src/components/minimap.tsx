"use client";

import { useRouter } from "next/navigation";
import { DISTRICTS, MARKERS } from "./map-data";

/** Tiny ASCII-style minimap shown on inner pages. */
export function MiniMap({ active }: { active?: string }) {
  const router = useRouter();
  const rows: string[] = [];
  for (let y = 0; y < 50; y++) {
    let line = "";
    for (let x = 0; x < 100; x++) {
      let ch = " ";
      for (const d of DISTRICTS) {
        if (x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1) {
          ch = d === DISTRICTS.find((dd) => dd.id === active) ? "#" : ".";
          break;
        }
      }
      for (const m of MARKERS) {
        if (m.x === x && m.y === y) { ch = "*"; break; }
      }
      line += ch;
    }
    rows.push(line);
  }

  return (
    <button
      onClick={() => router.push("/map")}
      className="hidden md:block fixed bottom-6 left-6 z-40 w-[220px] hairline bg-paper hover:bg-ink hover:text-paper transition-colors group"
      aria-label="Open city map"
      title="Back to the city map"
    >
      <pre className="ascii w-full m-0 p-2 text-[3px] leading-none overflow-hidden" style={{ lineHeight: 1 }}>
        {rows.map((r, i) => (
          <div key={i}>{r}</div>
        ))}
      </pre>
      <div className="flex items-center justify-between px-2 py-1 border-t border-ruleSoft">
        <span className="label !text-[9px]">MZANSI CITY</span>
        <span className="label !text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">OPEN MAP</span>
      </div>
    </button>
  );
}