"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload, Download, Trophy } from "lucide-react";
import { api, type LeaderRow, type Subject } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { AsciiArt, ART_CITY, ART_MOUNTAIN, ART_WAVE } from "@/components/ascii_art";

export default function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [top, setTop] = useState<LeaderRow[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    if (!loading && user) router.replace("/leaderboard");
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
    <div className="min-h-screen bg-night flex flex-col">
      <header className="border-b border-cinder">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <img src="/logo.png" alt="EduRank" className="h-12 w-auto inverted-logo" />
          </Link>
          <div className="flex items-center gap-5">
            <span className="label hidden sm:inline">SOUTH AFRICA · GRADES 8–12</span>
            <Link href="/login" className="font-mono text-[11px] uppercase tracking-label text-ghost hover:text-ash no-underline">
              Log in
            </Link>
            <Link href="/register" className="btn-solid">
              Join the ranks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1400px] w-full mx-auto px-6 grid lg:grid-cols-[7fr_5fr] gap-12 items-start pt-16 pb-24 flex-1">
        <div className="animate-rise">
          <div className="label mb-6 flex items-center gap-2">
            <span className="text-mark animate-flicker">●</span>
            FOR THE KIDS THEY GAVE UP ON
          </div>
          <h1 className="font-serif text-display font-medium tracking-display leading-none mb-8">
            They said
            <br />
            you were
            <br />
            <span className="text-mark italic font-normal glow-mark">average.</span>
          </h1>
          <p className="measure text-[17px] text-ash leading-relaxed">
            So you built a board they can&rsquo;t ignore. Upload notes, earn{" "}
            <span className="font-mono font-bold text-ash">PTS</span>, unlock the best study
            material in the country — and climb past every single one of them.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link href="/register" className="btn-mark">
              Start the climb <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/login" className="btn-ghost">
              I&apos;m already climbing
            </Link>
          </div>

          <div className="rule mt-12 pt-6 grid grid-cols-3 gap-6">
            <Stat label="Notes circulating" value={totalNotes.toLocaleString("en-ZA")} />
            <Stat label="Subjects" value={subjects.length.toString().padStart(2, "0")} />
            <Stat label="PTS by #1 player" value={(top[0]?.points ?? 0).toLocaleString("en-ZA")} />
          </div>
        </div>

        {/* Right column — board */}
        <aside className="hairline p-6 lg:sticky lg:top-8 w-full max-w-md justify-self-end bg-oil">
          <div className="flex items-baseline justify-between mb-6">
            <span className="label">NATIONAL BOARD · ALL-TIME · {now || "—"}</span>
            <Link href="/register" className="label text-ash no-underline hover:text-mark">
              ENTER →
            </Link>
          </div>
          <ol className="font-mono text-[13px]">
            {top.map((row, i) => (
              <li
                key={row.userId}
                className={`flex items-baseline justify-between border-b border-smoke py-1.5 ${i === 0 ? "text-mark" : ""}`}
                style={i === 0 ? { textShadow: "0 0 12px rgba(232,73,47,0.5)" } : undefined}
              >
                <span className="flex items-baseline gap-3 min-w-0">
                  <span className={`w-6 shrink-0 ${row.rank === 1 ? "text-mark font-bold" : "text-ghost"}`}>
                    {String(row.rank).padStart(2, "0")}
                  </span>
                  <span className="truncate">{row.displayName}</span>
                </span>
                <span className="shrink-0 tabular-nums">{row.points.toLocaleString("en-ZA")}</span>
              </li>
            ))}
            {top.length === 0 && (
              <li className="text-ghost py-6 text-center text-[12px]">The board goes live when the first player drops.</li>
            )}
          </ol>
          <div className="mt-4 flex items-center gap-2 label">
            <span className="text-mark animate-ember">#1</span> THE SEAT IS YOURS
          </div>
        </aside>
      </section>

      {/* Night city — the dark side */}
      <section className="max-w-[1400px] w-full mx-auto px-6 pb-24">
        <div className="scanline relative overflow-hidden">
          <AsciiArt art={ART_CITY} size="clamp(3px, 0.72vw, 8px)" className="ascii-embers min-w-[640px] text-center" />
        </div>
        <div className="mt-5 max-w-2xl">
          <div className="label mb-1 text-mark">THE NIGHT SHIFT</div>
          <div className="font-serif text-2xl font-medium tracking-tight">
            While the class sleeps, the board wakes up.
          </div>
          <p className="text-ghost text-[14px] mt-2 leading-relaxed">
            The kid burning the midnight oil is the one they&rsquo;ll regret writing off. Your streak, your
            notes, your rank — alive after dark.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-[1400px] w-full mx-auto px-6 pb-24">
        <div className="flex items-baseline gap-3 mb-10">
          <span className="label">HOW IT WORKS</span>
          <span className="flex-1 h-px bg-cinder" />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Step n="01" icon={<Upload className="w-4 h-4" />} title="Drop a note" body="Upload CAPS-aligned notes, summaries and past papers. Review clears them onto the board." />
          <Step n="02" icon={<Download className="w-4 h-4" />} title="Earn PTS" body="Every approval pays instantly; every download, upvote and referral keeps the wallet growing." />
          <Step n="03" icon={<Trophy className="w-4 h-4" />} title="Outrank them" body="Trade PTS for premium packs and climb from your school to the national board." />
        </div>
      </section>

      {/* Mountain — ascent */}
      <section className="max-w-[1400px] w-full mx-auto px-6 pb-24">
        <div className="flex items-baseline gap-3 mb-10">
          <span className="label">THE CLIMB</span>
          <span className="flex-1 h-px bg-cinder" />
        </div>
        <div className="scanline relative overflow-hidden">
          <AsciiArt art={ART_MOUNTAIN} size="clamp(3px, 0.72vw, 8px)" className="ascii-embers min-w-[640px] text-center" />
        </div>
        <div className="mt-5 max-w-2xl">
          <div className="label mb-1 text-mark">OWN THE CURVE</div>
          <div className="font-serif text-2xl font-medium tracking-tight">
            It&rsquo;s a long way up. That&rsquo;s the point.
          </div>
          <p className="text-ghost text-[14px] mt-2 leading-relaxed">
            No shortcut, no favours — just your notes and your grind. Every rank you take is one
            they thought they had locked.
          </p>
        </div>
      </section>

      {/* Final CTA + wave */}
      <section className="max-w-[1400px] w-full mx-auto px-6 pb-24">
        <div className="hairline p-8 text-center bg-oil">
          <div className="label mb-2 text-mark">THE CURVE</div>
          <div className="font-serif text-3xl font-medium tracking-tight mb-3">
            The next wave doesn&rsquo;t wait.
          </div>
          <Link href="/register" className="btn-mark">
            Take your rank <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-cinder">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <span className="label">© EduRank · 2026</span>
          <span className="label">GRADES 8–12 · THE BOARD IS WAITING</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="stat-value text-ash">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="panel p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-label text-mark">{n}</span>
        <span className="text-ghost">{icon}</span>
      </div>
      <div className="font-medium text-ash">{title}</div>
      <p className="text-ghost text-[13px] leading-relaxed">{body}</p>
      <div className="mt-auto flex items-center gap-2 label !text-[9px]">
        <span className="text-mark">›</span> IN PLAY
      </div>
    </div>
  );
}