"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Trophy, UploadCloud } from "lucide-react";
import { api, type Subject } from "@/lib/api";
import { CityMap } from "@/components/city-map";
import { PTS, Spinner } from "@/components/hud";
import { useAuth } from "@/lib/store";
import { tierFor } from "@edurank/shared";

export default function MapPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  useEffect(() => {
    api.subjects().then((r) => setSubjects(r.items)).catch(() => setSubjects([]));
  }, []);

  const noteCounts = useMemo(() => {
    const map: Record<string, number> = {};
    subjects?.forEach((s) => (map[s.id] = s.noteCount));
    return map;
  }, [subjects]);

  const tier = user ? tierFor(user.totalEarned) : null;

  if (!user || subjects === null) return <Spinner label="DRAFTING THE CITY…" />;

  return (
    <div className="-mx-4 -my-6">
      {/* desktop: full-bleed map; mobile: vertical district list */}
      <div className="relative h-[calc(100vh-3.5rem)] min-h-[560px] hidden md:block">
        <CityMap noteCounts={noteCounts} />

        {/* HUD overlay: player card */}
        <div className="absolute top-4 right-4 z-10 w-[290px] panel p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="hud-label">PLAYER STATUS</span>
            <span
              className="font-mono text-[10px] tracking-hud uppercase px-2 py-0.5 border"
              style={{ color: tier?.color, borderColor: `${tier!.color}55`, background: `${tier!.color}11` }}
            >
              {tier!.label}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <PTS value={user.balance} size="lg" />
            <span className="font-mono text-xs text-mute">
              RANK #{user.rank}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <Link href="/challenges" className="border border-line bg-surface-2 clip-hud-sm px-2 py-2 hover:border-gold/50 transition-colors group">
              <Flame className="w-4 h-4 mx-auto text-gold" />
              <div className="font-mono text-xs mt-1">{user.streakCount}d streak</div>
            </Link>
            <Link href="/leaderboard" className="border border-line bg-surface-2 clip-hud-sm px-2 py-2 hover:border-volt/50 transition-colors group">
              <Trophy className="w-4 h-4 mx-auto text-volt" />
              <div className="font-mono text-xs mt-1">{user.totalEarned.toLocaleString("en-ZA")} earned</div>
            </Link>
          </div>
          <Link href="/upload" className="btn-volt w-full mt-3 !py-2 text-xs">
            <UploadCloud className="w-4 h-4" /> DROP A NOTE +50 PTS
          </Link>
        </div>

        {/* HUD overlay: breadcrumb */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="hud-label mb-1">MZANSI CITY · DISTRICT SELECT</div>
          <div className="font-display uppercase text-3xl leading-none" style={{ textShadow: "0 2px 12px rgba(0,0,0,.8)" }}>
            Choose your ground
          </div>
        </div>
      </div>

      {/* mobile fallback: same visual language, vertical */}
      <div className="md:hidden px-4 py-6 space-y-6">
        <div>
          <div className="hud-label mb-1">MZANSI CITY</div>
          <h1 className="font-display uppercase text-4xl leading-none">District select</h1>
          <div className="mt-3 flex items-center gap-3">
            <PTS value={user.balance} size="md" />
            <span className="chip">RANK #{user.rank}</span>
            <span className="chip">{user.streakCount}d streak</span>
          </div>
        </div>
        <ul className="space-y-2">
          {(subjects ?? []).map((s) => (
            <li key={s.id}>
              <Link href={`/district/${s.id}`} className="panel p-4 flex items-center gap-3 hover:border-ink/30 transition-colors" style={{ borderLeft: `3px solid ${s.color}` }}>
                <div className="flex-1">
                  <div className="font-display uppercase tracking-wide">{s.name}</div>
                  <div className="text-mute text-xs mt-0.5 line-clamp-1">{s.blurb}</div>
                </div>
                <span className="font-mono text-xs" style={{ color: s.color }}>
                  {String(s.noteCount).padStart(2, "0")} NOTES
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/leaderboard" className="btn-ghost w-full text-xs"><Trophy className="w-4 h-4" /> RANKS</Link>
          <Link href="/upload" className="btn-volt w-full text-xs"><UploadCloud className="w-4 h-4" /> UPLOAD</Link>
        </div>
      </div>
    </div>
  );
}
