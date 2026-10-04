"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Download, Flame, ThumbsUp, Trophy, UploadCloud } from "lucide-react";
import { api, type ChallengesResponse } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, Progress, ErrorPanel, Spinner, useMidnightCountdown } from "@/components/hud";
import { CHALLENGE_CATALOG } from "@edurank/shared";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Download,
  UploadCloud,
  ThumbsUp,
  Flame,
};

export default function ChallengesPage() {
  const { setUser } = useAuth();
  const [data, setData] = useState<ChallengesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const countdown = useMidnightCountdown();

  const load = useCallback(() => {
    api
      .challenges()
      .then((r) => {
        setData(r);
        setError(null);
        setUser((u) => (u ? { ...u, balance: r.balance } : u));
      })
      .catch((e) => setError(e.message));
  }, [setUser]);

  useEffect(load, [load]);

  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  if (error) return <ErrorPanel message={error} onRetry={load} />;
  if (!data) return <Spinner label="BRIEFING TODAY'S CHALLENGES…" />;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="label inline-flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> DAILY CHALLENGES</div>
          <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">Today&rsquo;s board.</h1>
        </div>
        <div className="text-right">
          <div className="label inline-flex items-center gap-1.5"><CalendarClock className="w-3 h-3" /> RESETS IN</div>
          <div className="font-mono text-2xl tabular-nums">{countdown}</div>
        </div>
      </div>

      <div className="rule" />

      <ul className="space-y-4">
        {data.challenges.map((c) => {
          const Icon = c.icon === "Flame" ? Flame : ICONS[c.icon] ?? CalendarClock;
          return (
            <li key={c.key} className={`panel p-5 ${c.complete ? "border-accent" : ""}`}>
              <div className="flex items-start gap-4">
                <Icon className={`w-5 h-5 mt-1 shrink-0 ${c.complete ? "text-accent" : "text-mute"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{c.label}</span>
                    <PTS value={c.reward} size="sm" />
                  </div>
                  <p className="text-mute text-[13px] mt-0.5">{c.hint}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <Progress value={c.progress} target={c.target} />
                    </div>
                    <span className="font-mono text-[11px] text-mute shrink-0 tabular-nums">
                      {Math.min(c.progress, c.target)}/{c.target}
                    </span>
                  </div>
                  {c.claimed && <div className="label !text-[9px] mt-2 text-accent">CLEARED · REWARD BANKED</div>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="label text-center">
        FULL CATALOGUE ROTATES DAILY · {CHALLENGE_CATALOG.length} CHALLENGE TYPES · PROGRESS COUNTS LIVE FROM REAL ACTIVITY
      </p>
    </div>
  );
}