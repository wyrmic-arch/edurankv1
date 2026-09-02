"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MAP_W,
  MAP_H,
  SA_OUTLINE,
  PROVINCES,
  schoolPos,
  type School,
} from "./school-map-data";

interface Overlay {
  school: School;
}

// Zoom bounds (viewBox units shown per screen).
const MIN_SCALE = 0.9;
const MAX_SCALE = 6;

/**
 * EDURANK — interactive school map of South Africa.
 *
 * Pan by dragging, zoom with the wheel / buttons / pinch. Schools are dots
 * sized by their player count; hover pulses, your claimed school is ringed.
 * Search narrows the field, province chips filter it. Click a dot to open
 * its file overlay.
 */
export function SchoolMap({ schools }: { schools: School[] }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [q, setQ] = useState("");
  const [province, setProvince] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // pan/zoom state
  const [view, setView] = useState({ x: 0, y: 0, s: 1 });
  const drag = useRef<{ px: number; py: number; x: number; y: number; active: boolean }>({
    px: 0,
    py: 0,
    x: 0,
    y: 0,
    active: false,
  });
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return schools.filter((s) => {
      if (province && s.province !== province) return false;
      if (!needle) return true;
      return (
        s.name.toLowerCase().includes(needle) ||
        (s.city ?? "").toLowerCase().includes(needle) ||
        s.province.toLowerCase().includes(needle)
      );
    });
  }, [schools, q, province]);

  const highlightSet = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered]);

  const maxCount = useMemo(
    () => Math.max(1, ...schools.map((s) => s.playerCount)),
    [schools],
  );

  function open(school: School) {
    setOverlay({ school });
  }

  async function claimSchool(school: School) {
    try {
      const { user } = await (await import("@/lib/api")).api.updateMe({ schoolId: school.id });
      if (user) setSavedId(school.id);
    } catch {
      // stay on the button; user can retry
    }
  }

  // --- pan / zoom -------------------------------------------------------
  const toLocal = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * MAP_W,
      y: ((clientY - rect.top) / rect.height) * MAP_H,
    };
  }, []);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoomAt(e.clientX, e.clientY, factor);
  }

  function zoomAt(clientX: number, clientY: number, factor: number) {
    const svg = svgRef.current;
    if (!svg) return;
    setView((v) => {
      const ns = clamp(v.s * factor, MIN_SCALE, MAX_SCALE);
      const k = ns / v.s;
      const rect = svg.getBoundingClientRect();
      // pointer position in map units (pre-transform)
      const mx = ((clientX - rect.left) / rect.width) * MAP_W;
      const my = ((clientY - rect.top) / rect.height) * MAP_H;
      return {
        s: ns,
        x: mx - (mx - v.x) * k,
        y: my - (my - v.y) * k,
      };
    });
  }

  function zoomBy(factor: number) {
    const svg = svgRef.current;
    if (!svg) {
      setView((v) => ({ ...v, s: clamp(v.s * factor, MIN_SCALE, MAX_SCALE) }));
      return;
    }
    const rect = svg.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }

  function resetView() {
    setView({ x: 0, y: 0, s: 1 });
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      drag.current = { px: e.clientX, py: e.clientY, x: view.x, y: view.y, active: true };
      (drag.current as unknown as { pinch?: number }).pinch = undefined;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const pts = pointers.current;
    if (pts.has(e.pointerId)) {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pts.size >= 2) {
      const arr = [...pts.values()];
      const d = Math.hypot(arr[0]!.x - arr[1]!.x, arr[0]!.y - arr[1]!.y);
      const state = drag.current as unknown as { pinch?: number };
      const mx = (arr[0]!.x + arr[1]!.x) / 2;
      const my = (arr[0]!.y + arr[1]!.y) / 2;
      if (state.pinch == null) {
        state.pinch = d;
        drag.current.px = mx;
        drag.current.py = my;
        return;
      }
      zoomAt(mx, my, d / state.pinch);
      state.pinch = d;
      return;
    }
    if (!drag.current.active || pts.size !== 1) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const k = MAP_W / rect.width;
    setView((v) => ({
      ...v,
      x: drag.current.x + (e.clientX - drag.current.px) * k,
      y: drag.current.y + (e.clientY - drag.current.py) * k,
    }));
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      drag.current.active = false;
      (drag.current as unknown as { pinch?: number }).pinch = undefined;
    }
  }

  // wheel must not be passive — attach via effect.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(e.clientX, e.clientY, factor);
    };
    svg.addEventListener("wheel", handler, { passive: false });
    return () => svg.removeEventListener("wheel", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const provinces = useMemo(
    () => Array.from(new Set(schools.map((s) => s.province))).sort(),
    [schools],
  );

  return (
    <div ref={wrapRef} className="relative w-full bg-paper hairline overflow-hidden">
      {/* search + filters */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[min(480px,calc(100%-16px))] flex flex-col gap-2">
        <div className="flex items-center gap-2 hairline bg-paper px-3 shadow-[2px_2px_0_0_rgba(10,10,10,0.9)]">
          <span className="label text-mute">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find your school, city or province…"
            className="flex-1 bg-transparent border-none px-0 py-2.5 text-body placeholder:text-dim focus:border-none focus:outline-none"
            aria-label="Search schools"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="font-mono text-[11px] text-dim hover:text-ink"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <span className="label hidden sm:inline">{filtered.length}/{schools.length}</span>
        </div>
        <div className="flex flex-wrap gap-1 justify-center">
          {provinces.map((p) => (
            <button
              key={p}
              onClick={() => setProvince(province === p ? null : p)}
              className={`font-mono text-[10px] uppercase tracking-label border px-2 py-1 transition-colors ${
                province === p
                  ? "border-ink bg-ink text-paper"
                  : "border-ruleSoft bg-paper text-mute hover:border-ink hover:text-ink"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* zoom controls */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1">
        <button onClick={() => zoomBy(1.3)} className="w-9 h-9 panel text-lg leading-none hover:bg-ink hover:text-paper" aria-label="Zoom in">
          +
        </button>
        <button onClick={() => zoomBy(1 / 1.3)} className="w-9 h-9 panel text-lg leading-none hover:bg-ink hover:text-paper" aria-label="Zoom out">
          −
        </button>
        <button onClick={resetView} className="w-9 h-9 panel text-[10px] font-mono leading-none hover:bg-ink hover:text-paper" aria-label="Reset view" title="Reset view">
          ⤾
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="block w-full h-auto cursor-grab active:cursor-grabbing touch-none select-none"
        preserveAspectRatio="xMidYMid meet"
        role="application"
        aria-label="South African schools map"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <radialGradient id="oceanGlow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#E2E2DA" />
            <stop offset="100%" stopColor="#EFEFEC" />
          </radialGradient>
          <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0A0A0A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.s})`}>
          {/* ocean */}
          <rect x={-400} y={-400} width={MAP_W + 800} height={MAP_H + 800} fill="url(#oceanGlow)" />

          {/* graticule */}
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`gv${i}`} x1={i * 66} y1={-400} x2={i * 66} y2={MAP_H + 400} stroke="#0A0A0A" strokeOpacity="0.025" strokeWidth="1" />
          ))}
          {Array.from({ length: 17 }).map((_, i) => (
            <line key={`gh${i}`} x1={-400} y1={i * 66} x2={MAP_W + 400} y2={i * 66} stroke="#0A0A0A" strokeOpacity="0.025" strokeWidth="1" />
          ))}

          {/* country outline */}
          <path
            d={SA_OUTLINE.join(" ")}
            fill="#EFEFEC"
            fillRule="evenodd"
            stroke="#0A0A0A"
            strokeOpacity="0.45"
            strokeWidth="1.4"
          />
          {/* soft inner land shadow */}
          <path
            d={SA_OUTLINE.join(" ")}
            fill="none"
            fillRule="evenodd"
            stroke="#0A0A0A"
            strokeOpacity="0.06"
            strokeWidth="10"
          />

          {/* province markers */}
          {PROVINCES.map((p) => {
            const pos = schoolPos({ lat: p.lat, lng: p.lng } as School);
            if (!pos) return null;
            const [x, y] = pos;
            const active = province === p.name;
            return (
              <g key={p.name} opacity={active ? 1 : 0.5}>
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="11"
                  letterSpacing="0.14em"
                  fill="#0A0A0A"
                  fillOpacity="0.22"
                >
                  {p.name.toUpperCase()}
                </text>
                <circle cx={x} cy={y} r={2.4} fill="#0A0A0A" fillOpacity="0.18" />
              </g>
            );
          })}

          {/* school dots */}
          {schools.map((s) => {
            const pos = schoolPos(s);
            if (!pos) return null;
            const [x, y] = pos;
            const isHot = highlightSet.has(s.id);
            const isHover = hovered === s.id;
            const isSaved = savedId === s.id;
            if (!isHot) return null;
            const r = 2.2 + Math.sqrt(s.playerCount / maxCount) * 4;
            const size = isHover ? r * 1.5 : r;
            return (
              <g
                key={s.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(s.id)}
                onFocus={() => setHovered(s.id)}
                onBlur={() => setHovered((h) => (h === s.id ? null : h))}
                onClick={() => open(s)}
                tabIndex={0}
                role="button"
                aria-label={s.name}
                className="outline-none"
              >
                {/* touch/click target */}
                <circle cx={x} cy={y} r={14 / Math.max(view.s, 1)} fill="transparent" />

                {/* glow */}
                {(isHover || isSaved) && (
                  <circle cx={x} cy={y} r={size * 3} fill="url(#dotGlow)" />
                )}

                {/* pulse ring for saved school */}
                {isSaved && (
                  <circle cx={x} cy={y} r={size * 2.4} fill="none" stroke="#1B5E20" strokeOpacity="0.6" strokeWidth="1.2" className="animate-ping-slow" />
                )}

                <circle
                  cx={x}
                  cy={y}
                  r={isSaved ? size + 2 : size}
                  fill={isSaved ? "#1B5E20" : "#0A0A0A"}
                  fillOpacity={isHover ? 1 : isSaved ? 1 : 0.72}
                  stroke={isHover ? "#C83A2A" : isSaved ? "#1B5E20" : "none"}
                  strokeWidth={isHover ? 1.4 : 0}
                  className="transition-all duration-150"
                />

                {(isHover || isSaved) && (
                  <text
                    x={x}
                    y={y - size - 8}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize="12"
                    fontWeight="700"
                    fill="#0A0A0A"
                    style={{ paintOrder: "stroke", stroke: "#EFEFEC", strokeWidth: 3 }}
                  >
                    {s.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* compass rose */}
        <g transform={`translate(${MAP_W - 34} ${36})`} opacity="0.5">
          <circle r="14" fill="none" stroke="#0A0A0A" strokeWidth="1" />
          <line x1="0" y1="-10" x2="0" y2="10" stroke="#0A0A0A" strokeWidth="1" />
          <line x1="-10" y1="0" x2="10" y2="0" stroke="#0A0A0A" strokeWidth="1" />
          <polygon points="0,-9 -3,1 0,-1 3,1" fill="#0A0A0A" />
          <text x="0" y="-16" textAnchor="middle" className="font-mono" fontSize="9" fill="#0A0A0A" fontWeight="700">N</text>
        </g>
      </svg>

      {/* bottom legend */}
      <div className="absolute bottom-3 left-3 pointer-events-none hidden sm:block">
        <div className="label">SA · HIGH SCHOOLS · {schools.length} ON THE BOARD</div>
        <div className="label mt-1">DRAG TO PAN · SCROLL TO ZOOM · CLICK A DOT</div>
      </div>

      <div className="absolute bottom-3 right-3 pointer-events-none text-right hidden sm:block">
        <div className="label">{filtered.length} MATCHING</div>
      </div>

      {/* overlay */}
      {overlay && (
        <div
          className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-paper/90 backdrop-blur-[1px]"
          onClick={() => setOverlay(null)}
        >
          <div
            className="w-full max-w-md panel p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-baseline justify-between gap-4 mb-1">
              <div className="font-serif text-2xl font-medium leading-tight">{overlay.school.name}</div>
              <button
                onClick={() => setOverlay(null)}
                className="font-mono text-[11px] uppercase tracking-label text-mute hover:text-ink border border-ruleSoft hover:border-ink px-2 py-1 shrink-0"
                aria-label="Close"
              >
                CLOSE
              </button>
            </div>
            <div className="label mb-5">
              {[overlay.school.city, overlay.school.province].filter(Boolean).join(" · ") || overlay.school.province}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="stat">
                <div className="stat-value">{overlay.school.playerCount}</div>
                <div className="stat-label">STUDENTS</div>
              </div>
              <div className="stat">
                <div className="stat-value">{savedId === overlay.school.id ? "✓" : "—"}</div>
                <div className="stat-label">YOURS</div>
              </div>
              <div className="stat">
                <div className="stat-value !text-sm break-words">{overlay.school.province}</div>
                <div className="stat-label">PROVINCE</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => void claimSchool(overlay.school)}
                className="btn-solid w-full"
                disabled={savedId === overlay.school.id}
              >
                {savedId === overlay.school.id ? "SET AS YOUR SCHOOL ✓" : "THIS IS MY SCHOOL"}
              </button>
              <button
                onClick={() => router.push(`/leaderboard?scope=school&schoolId=${overlay.school.id}`)}
                className="btn-ghost w-full"
              >
                VIEW SCHOOL RANK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
