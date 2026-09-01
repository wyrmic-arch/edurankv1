"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api, type LeaderRow, type Subject } from "@/lib/api";
import { useAuth } from "@/lib/store";

export default function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [top, setTop] = useState<LeaderRow[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    if (!loading && user) router.replace("/map");
  }, [loading, user, router]);

  useEffect(() => {
    api.subjects().then((r) => {
      setSubjects(r.items);
      setTotalNotes(r.items.reduce((a, s) => a + s.noteCount, 0));
    }).catch(() => {});
    api.leaderboard("global", "all-time").then((r) => setTop(r.items.slice(0, 8))).catch(() => {});
    setNow(new Date().toISOString().slice(0, 10));
  }, []);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-ink">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-mono text-[15px] font-bold tracking-tight no-underline">
            EDURANK <span className="label !text-[9px] ml-1">MZANSI CITY</span>
          </Link>
          <div className="flex items-center gap-5">
            <span className="label hidden sm:inline">SOUTH AFRICA · GRADES 8–12 · CAPS ALIGNED</span>
            <Link href="/login" className="font-mono text-[11px] uppercase tracking-label text-mute hover:text-ink no-underline">
              Log in
            </Link>
            <Link href="/register" className="btn-solid">
              Enlist free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1400px] w-full mx-auto px-6 grid lg:grid-cols-[7fr_5fr] gap-12 items-start pt-20 pb-24 flex-1">
        <div>
          <div className="label mb-6">
            A study-notes arena — <span className="text-mark">one place to buy, sell, and share.</span>
          </div>
          <h1 className="font-serif text-display font-medium tracking-display leading-none mb-8">
            Climb
            <br />
            the ranks.
            <br />
            <span className="text-mute italic font-normal">Own the curve.</span>
          </h1>
          <p className="measure text-[17px] text-ink leading-relaxed">
            Upload your notes, earn <span className="font-mono font-bold">PTS</span>, unlock exam
            packs from the sharpest students in the country — and take your district on the map.
            Built by a 20-year-old who watched classmates buy and sell notes in school, so
            they have one place to do it.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link href="/register" className="btn-solid">
              Start earning PTS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/login" className="btn-ghost">
              I&apos;m already enlisted
            </Link>
          </div>

          <div className="rule mt-12 pt-6 grid grid-cols-3 gap-6">
            <Stat label="Notes circulating" value={totalNotes.toLocaleString("en-ZA")} />
            <Stat label="Subject districts" value={subjects.length.toString().padStart(2, "0")} />
            <Stat label="PTS by #1 player" value={(top[0]?.points ?? 0).toLocaleString("en-ZA")} />
          </div>
        </div>

        {/* Right column — board */}
        <aside className="hairline p-6 lg:sticky lg:top-8 w-full max-w-md justify-self-end">
          <div className="flex items-baseline justify-between mb-6">
            <span className="label">NATIONAL BOARD · ALL-TIME · {now || "—"}</span>
            <Link href="/register" className="label text-ink no-underline hover:underline">
              ENTER →
            </Link>
          </div>
          <ol className="font-mono text-[13px]">
            {top.map((row) => (
              <li
                key={row.userId}
                className="flex items-baseline justify-between border-b border-ruleSoft py-1.5"
              >
                <span className="flex items-baseline gap-3 min-w-0">
                  <span className={`w-6 shrink-0 ${row.rank === 1 ? "text-mark font-bold" : "text-mute"}`}>
                    {String(row.rank).padStart(2, "0")}
                  </span>
                  <span className="truncate">{row.displayName}</span>
                </span>
                <span className="shrink-0 tabular-nums">{row.points.toLocaleString("en-ZA")}</span>
              </li>
            ))}
            {top.length === 0 && (
              <li className="text-mute py-6 text-center text-[12px]">Board goes live once players enlist.</li>
            )}
          </ol>
        </aside>
      </section>

      <footer className="border-t border-ink">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <span className="label">© EduRank · 2026 · {process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") ?? "—"}</span>
          <span className="label">Points-only economy · real-money payouts teased for launch · district art via Unsplash</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}