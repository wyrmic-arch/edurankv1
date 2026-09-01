"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type Subject } from "@/lib/api";
import { CityMap } from "@/components/city-map";
import { Spinner } from "@/components/hud";
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
    <div className="-mx-6 -my-6 px-6 py-6">
      <div className="flex items-baseline justify-between gap-6 mb-6">
        <div>
          <div className="label">MZANSI CITY · DISTRICT SELECT</div>
          <h1 className="font-serif text-4xl font-medium tracking-tight leading-none mt-1">
            Choose your ground.
          </h1>
        </div>
        {user && (
          <div className="flex items-center gap-8 text-right">
            <div>
              <div className="label">WALLET</div>
              <div className="font-mono text-2xl tabular-nums">{user.balance.toLocaleString("en-ZA")} PTS</div>
            </div>
            <div>
              <div className="label">RANK</div>
              <div className="font-mono text-2xl tabular-nums">#{user.rank}</div>
            </div>
            <div>
              <div className="label">TIER</div>
              <div className="font-mono text-2xl tabular-nums" style={{ color: tier?.color }}>{tier?.label}</div>
            </div>
          </div>
        )}
      </div>

      <div className="relative hairline">
        <CityMap noteCounts={noteCounts} />
      </div>

      <div className="rule mt-6 pt-4 flex items-baseline justify-between gap-4">
        <p className="text-mute text-[13px]">
          {subjects.length} subject districts · click a district to enter its archive.
        </p>
        <div className="flex gap-4">
          <Link href="/leaderboard" className="font-mono text-[11px] uppercase tracking-label no-underline hover:underline">
            Ranks →
          </Link>
          <Link href="/upload" className="font-mono text-[11px] uppercase tracking-label text-mark no-underline hover:underline">
            Upload →
          </Link>
        </div>
      </div>
    </div>
  );
}