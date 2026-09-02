"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload, Download, Trophy } from "lucide-react";
import { api, type LeaderRow, type Subject } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { AsciiArt, ART_WAVE, ART_HORIZON, ART_PROMPT } from "@/components/ascii";

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
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-ink">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-mono text-[15px] font-bold tracking-tight no-underline">
            EDURANK
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
      <section className="max-w-[1400px] w-full mx-auto px-6 grid lg:grid-cols-[7fr_5fr] gap-12 items-start pt-14 pb-24 flex-1">
        <div>
          {/* ASCII logotype */}
          <div className="mb-8">
            <AsciiArt
              art={[
                "##### ####  #   # ####   ###  #   # #   # ",
                "#     #   # #   # #   # #   # ##  # #  #  ",
                "####  #   # #   # ####  ##### # # # ###   ",
                "#     #   # #   # #  #  #   # #  ## #  #  ",
                "##### ####   ###  #   # #   # #   # #   # ",
              ].join("\n")}
              size="clamp(7px, 1.4vw, 16px)"
              className="ascii-glow text-ink"
            />
          </div>

          <div className="label mb-6 flex items-center gap-2">
            <span className="text-mark">›</span>
            A study-notes arena — <span className="text-mark">one place to buy, sell, and share.</span>
            <span className="animate-caret text-ink">█</span>
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
            packs from the sharpest students in the country — and climb from your school to the
            national board. Built by a 20-year-old who watched classmates buy and sell notes in
            school, so they have one place to do it.
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
            <Stat label="Subjects" value={subjects.length.toString().padStart(2, "0")} />
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

      {/* How it works — ASCII */}
      <section className="max-w-[1400px] w-full mx-auto px-6 pb-24">
        <div className="flex items-baseline gap-3 mb-10">
          <span className="sql-prompt text-mark">$</span>
          <span className="label">how it works</span>
          <span className="flex-1 h-px bg-ink/20" />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Step n="01" icon={<Upload className="w-4 h-4" />} title="Drop a note" body="Upload CAPS-aligned notes, summaries and past papers. Review clears them onto the board." />
          <Step n="02" icon={<Download className="w-4 h-4" />} title="Earn PTS" body="Every approval pays instantly; every download, upvote and referral keeps the wallet growing." />
          <Step n="03" icon={<Trophy className="w-4 h-4" />} title="Climb the ranks" body="Trade PTS for premium packs and climb from your school to the national board." />
        </div>

        {/* The Great Wave — feature piece */}
        <div className="hairline mt-16 p-6">
          <div className="label mb-4 flex items-center gap-2">
            <span className="text-mark">▸</span> THE CURVE · RENDERED IN ASCII
          </div>
          <div className="overflow-x-auto">
            <AsciiArt art={ART_WAVE} size="clamp(4px, 0.68vw, 8.5px)" className="min-w-[720px] text-ink" />
          </div>
          <p className="label mt-4">HOKUSAI · THE GREAT WAVE OFF KANAGAWA</p>
        </div>
      </section>

      {/* ASCII banner strip */}
      <section className="max-w-[1400px] w-full mx-auto px-6 pb-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 hairline p-8">
          <AsciiArt art={ART_HORIZON} size="clamp(5px, 0.8vw, 9px)" className="text-ink" />
          <div className="max-w-sm">
            <div className="label mb-1">JOIN THE ARENA</div>
            <div className="font-serif text-3xl font-medium tracking-tight mb-3">The board is waiting.</div>
            <Link href="/register" className="btn-solid">Enlist free <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <AsciiArt art={ART_PROMPT} size="clamp(5px, 0.8vw, 9px)" className="text-mute" />
        </div>
      </section>

      <footer className="border-t border-ink">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <span className="label">© EduRank · 2026 · {process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") ?? "—"}</span>
          <span className="label">Points-only economy · real-money payouts teased for launch · grades 8–12</span>
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

function Step({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="panel p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-label text-mark">{n}</span>
        <span className="text-mute">{icon}</span>
      </div>
      <div className="font-medium">{title}</div>
      <p className="text-mute text-[13px] leading-relaxed">{body}</p>
      <div className="mt-auto flex items-center gap-2 label !text-[9px]">
        <span className="text-mark">›</span> READY
      </div>
    </div>
  );
}