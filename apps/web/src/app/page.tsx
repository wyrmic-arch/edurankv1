"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, Flame, Trophy } from "lucide-react";
import { api, type LeaderRow, type Subject } from "@/lib/api";
import { PTS } from "@/components/hud";
import { useAuth } from "@/lib/store";

export default function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [top, setTop] = useState<LeaderRow[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);

  useEffect(() => {
    if (!loading && user) router.replace("/map");
  }, [loading, user, router]);

  useEffect(() => {
    api
      .subjects()
      .then((r) => {
        setSubjects(r.items);
        setTotalNotes(r.items.reduce((a, s) => a + s.noteCount, 0));
      })
      .catch(() => {});
    api
      .leaderboard("global", "all-time")
      .then((r) => setTop(r.items.slice(0, 5)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-void bg-grid flex flex-col">
      {/* top bar */}
      <header className="border-b border-line">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-display text-xl tracking-wider">
            EDU<span className="text-volt">RANK</span>
            <span className="hud-label !text-[9px] ml-2 mt-1 hidden sm:inline">™ MZANSI CITY</span>
          </span>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost !py-1.5 !px-3 text-xs">
              Log in
            </Link>
            <Link href="/register" className="btn-volt !py-1.5 !px-3 text-xs">
              Enlist free
            </Link>
          </div>
        </div>
      </header>

      {/* hero — asymmetric editorial, not centered */}
      <section className="max-w-[1400px] w-full mx-auto px-4 grid lg:grid-cols-[7fr_5fr] gap-10 items-start pt-14 pb-16 flex-1">
        <div>
          <div className="hud-label text-volt mb-4 animate-flicker">SOUTH AFRICA · GRADES 8–12 · CAPS ALIGNED</div>
          <h1 className="font-display uppercase leading-[0.92] text-[clamp(3rem,8vw,6.5rem)]">
            Climb
            <br />
            The Ranks.
            <br />
            <span className="stroke-title">Own The</span>
            <br />
            <span className="text-volt" style={{ textShadow: "0 0 32px rgba(166,255,63,.35)" }}>
              Curve.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-mute text-lg leading-relaxed">
            The study notes arena. Upload your notes, earn <span className="font-mono text-ink">PTS</span>, unlock
            exam packs from the sharpest students in the country — and take your district on the map.
          </p>
          <p className="mt-4 max-w-md text-dim text-sm leading-relaxed">
            Built by a 20-year-old who watched classmates buy and sell notes in school — so they have one place to do it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/register" className="btn-volt text-base px-7 py-3">
              Start earning PTS <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-ghost text-base px-7 py-3">
              I&apos;m already enlisted
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-6">
            <HeroStat value={String(totalNotes)} label="notes circulating" />
            <HeroStat value={String(subjects.length)} label="subject districts" />
            <HeroStat value={`${top[0]?.points.toLocaleString("en-ZA") ?? 0}`} label="PTS by the #1 player" tone="gold" />
          </div>
        </div>

        {/* live board preview */}
        <aside className="panel p-5 lg:sticky lg:top-8 w-full max-w-md justify-self-end">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              <span className="hud-label">NATIONAL BOARD · ALL-TIME</span>
            </div>
            <Link href="/register" className="hud-label text-volt inline-flex items-center gap-1 hover:underline">
              ENTER <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <ol className="space-y-2.5">
            {top.map((row) => (
              <li key={row.userId} className="flex items-center gap-3 border border-line/70 bg-surface-2/60 clip-hud-sm px-3 py-2">
                <span className={`font-mono text-sm ${row.rank === 1 ? "text-gold" : row.rank <= 3 ? "text-sky" : "text-dim"}`}>
                  #{row.rank}
                </span>
                <span className="flex-1 truncate font-medium">{row.displayName}</span>
                <span className="font-mono text-xs text-mute truncate hidden sm:inline">{row.schoolName ?? "—"}</span>
                <PTS value={row.points} size="sm" tone={row.rank === 1 ? "gold" : "volt"} />
              </li>
            ))}
            {top.length === 0 && (
              <li className="text-mute text-sm py-6 text-center">Board goes live once players enlist.</li>
            )}
          </ol>
        </aside>
      </section>

      {/* ticker */}
      <footer className="border-t border-line bg-surface-1 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee w-max py-2.5">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0">
              {subjects.map((s) => (
                <span key={`${copy}-${s.id}`} className="inline-flex items-center gap-2 mx-6 font-mono text-xs tracking-widest uppercase">
                  <Flame className="w-3 h-3" style={{ color: s.color }} />
                  <span style={{ color: s.color }}>{s.name}</span>
                  <span className="text-dim">{s.noteCount} NOTES</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-line px-4 py-2 text-center hud-label !text-[9px]">
          Points-only economy · real-money payouts teased for launch · district art via{" "}
          <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline hover:text-volt">
            Unsplash
          </a>
        </div>
      </footer>
    </div>
  );
}

function HeroStat({ value, label, tone = "volt" }: { value: string; label: string; tone?: "volt" | "gold" }) {
  return (
    <div className="border-l-2 pl-4" style={{ borderColor: tone === "gold" ? "#FFC24B55" : "#A6FF3F55" }}>
      <div className={`font-mono text-2xl font-bold ${tone === "gold" ? "text-gold" : "text-volt"}`}>{value}</div>
      <div className="hud-label mt-0.5">{label}</div>
    </div>
  );
}
