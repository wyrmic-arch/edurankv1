"use client";

import { useMemo, useRef, useState } from "react";
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

/**
 * EDURANK — school map of South Africa.
 *
 * Every registered SA high school is a dot on a stylised map of the country.
 * Search narrows the dots, hovering shows the name, and clicking opens an
 * overlay with the school's details and a "This is my school" action that
 * attaches the school to your profile.
 */
export function SchoolMap({ schools }: { schools: School[] }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        (s.city ?? "").toLowerCase().includes(needle) ||
        s.province.toLowerCase().includes(needle),
    );
  }, [schools, q]);

  const highlighted = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered]);

  function open(school: School) {
    setOverlay({ school });
  }

  async function claimSchool(school: School) {
    try {
      const { user } = await (await import("@/lib/api")).api.updateMe({ schoolId: school.id });
      if (user) setSavedId(school.id);
    } catch {
      // surface nothing — the button stays; user can retry
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full bg-paper hairline overflow-hidden">
      {/* search bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[min(420px,90%)]">
        <div className="flex items-center gap-2 hairline bg-paper px-3">
          <span className="label text-mute">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find your school, city or province…"
            className="flex-1 bg-transparent border-none px-0 py-2.5 text-body placeholder:text-dim focus:border-none focus:outline-none"
            aria-label="Search schools"
          />
          <span className="label hidden sm:inline">{filtered.length} SCHOOLS</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="block w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHovered(null)}
        role="application"
        aria-label="South African schools map"
      >
        <rect width={MAP_W} height={MAP_H} fill="#EFEFEC" />

        {/* faint grid */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={MAP_H} stroke="#0A0A0A" strokeOpacity="0.03" strokeWidth="1" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 100} x2={MAP_W} y2={i * 100} stroke="#0A0A0A" strokeOpacity="0.03" strokeWidth="1" />
        ))}

        {/* country outline */}
        <path
          d={SA_OUTLINE.join(" ")}
          fill="#E4E4DD"
          fillRule="evenodd"
          stroke="#0A0A0A"
          strokeOpacity="0.35"
          strokeWidth="1.2"
        />

        {/* province markers (tiny) */}
        {PROVINCES.map((p) => {
          const pos = schoolPos({ lat: p.lat, lng: p.lng } as School);
          if (!pos) return null;
          const [x, y] = pos;
          return (
            <text
              key={p.name}
              x={x}
              y={y}
              textAnchor="middle"
              className="font-mono"
              fontSize="9"
              letterSpacing="0.1em"
              fill="#0A0A0A"
              fillOpacity="0.18"
            >
              {p.name.split(" ")[0]?.toUpperCase()}
            </text>
          );
        })}

        {/* school dots */}
        {schools.map((s) => {
          const pos = schoolPos(s);
          if (!pos) return null;
          const [x, y] = pos;
          const isHot = highlighted.has(s.id);
          const isHover = hovered === s.id;
          const isSaved = savedId === s.id;
          return (
            <g
              key={s.id}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(s.id)}
              onClick={() => open(s)}
              opacity={isHot ? 1 : q ? 0.12 : 1}
              className="transition-opacity duration-150"
            >
              <circle cx={x} cy={y} r={12} fill="transparent" />
              <circle
                cx={x}
                cy={y}
                r={isHover ? 6 : isSaved ? 5 : 3.6}
                fill={isSaved ? "#1B5E20" : isHover ? "#0A0A0A" : "#0A0A0A"}
                fillOpacity={isHover ? 1 : 0.7}
                stroke={isSaved ? "#1B5E20" : isHover ? "#0A0A0A" : "none"}
                strokeWidth={isHover ? 1.5 : 0}
                className="transition-all duration-150"
              />
              {(isHover || isSaved) && (
                <text x={x} y={y - 10} textAnchor="middle" className="font-mono" fontSize="11" fill="#0A0A0A">
                  {s.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* bottom legend */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="label">SA · HIGH SCHOOLS · {schools.length} ON THE BOARD</div>
        <div className="label mt-1">CLICK A DOT TO OPEN ITS FILE</div>
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-none text-right">
        <div className="label">{filtered.length} MATCHING</div>
        <div className="label mt-1">⌕ SEARCH TO NARROW</div>
      </div>

      {/* overlay */}
      {overlay && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-paper/85 backdrop-blur-[1px]">
          <div className="w-full max-w-md panel p-6">
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

            <div className="flex gap-2 mb-5">
              <div className="stat flex-1">
                <div className="stat-value">{overlay.school.playerCount}</div>
                <div className="stat-label">STUDENTS</div>
              </div>
              <div className="stat flex-1">
                <div className="stat-value">{savedId === overlay.school.id ? "✓" : "—"}</div>
                <div className="stat-label">YOURS</div>
              </div>
              <div className="stat flex-1">
                <div className="stat-value">{overlay.school.province}</div>
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
