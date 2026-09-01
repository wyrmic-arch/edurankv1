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
  const { user, setUser } = useAuth();
  const [data, setData] = useState<ChallengesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const countdown = useMidnightCountdown();

  const load = useCallback(() => {
    api
      .challenges()
      .then((r) => {
        setData(r);
        if (user) setUser({ ...user, balance: r.balance });
      })
      .catch((e) => setError(e.message));
  }, [setUser, user]);

  useEffect(load, [load]);

  // re-poll after a few seconds in case an auto-claim landed mid-view
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  if (error) return <ErrorPanel message={error} onRetry={load} />;
  if (!data) return <Spinner label="BRIEFING TODAY'S HEISTS…" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="hud-label mb-1 inline-flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> DAILY HEISTS</div>
          <h1 className="font-display uppercase text-4xl">Today0027s board</h1>
        </div>
        <div className="text-right">
          <div className="hud-label inline-flex items-center gap-1.5"><CalendarClock className="w-3 h-3" /> RESETS IN</div>
          <div className="font-mono text-xl text-volt">{countdown}</div>
        </div>
      </div>

      <ul className="space-y-3">
        {data.challenges.map((c) => {
          const Icon = c.icon === "Flame" ? Flame : ICONS[c.icon] ?? CalendarClock;
          return (
            <li key={c.key} className={`panel p-5 ${c.complete ? "border-volt/40 shadow-glow-volt" : ""}`}>
              <div className="flex items-start gap-4">
                <span className={`w-10 h-10 shrink-0 flex items-center justify-center border clip-hud-sm ${c.complete ? "border-volt/60 bg-volt/10 text-volt" : "border-line bg-surface-2 text-mute"}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display uppercase tracking-wider">{c.label}</span>
                    <PTS value={c.reward} tone={c.claimed ? "ink" : "volt"} size="sm" />
                  </div>
                  <p className="text-mute text-sm mt-0.5">{c.hint}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <Progress value={c.progress} target={c.target} color={c.complete ? "#A6FF3F" : "#43D9FF"} />
                    </div>
                    <span className="font-mono text-xs text-mute shrink-0">
                      {Math.min(c.progress, c.target)}/{c.target}
                    </span>
                  </div>
                  {c.claimed && <div className="hud-label mt-2 !text-[9px] text-volt">CLEARED · REWARD BANKED</div>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="hud-label !text-[9px] text-center">
        FULL CATALOGUE ROTATES DAILY · {CHALLENGE_CATALOG.length} HEIST TYPES · PROGRESS COUNTS LIVE FROM REAL ACTIVITY
      </p>
    </div>
  );
}
