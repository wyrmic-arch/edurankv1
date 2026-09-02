"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { api, type Subject } from "@/lib/api";
import { Spinner } from "@/components/hud";
import { Prompt } from "@/components/ascii";

export default function BrowsePage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  useEffect(() => {
    api.subjects().then((r) => setSubjects(r.items)).catch(() => setSubjects([]));
  }, []);

  if (subjects === null) return <Spinner label="SCANNING THE ARCHIVE…" />;

  const totalNotes = subjects.reduce((a, s) => a + s.noteCount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Prompt>subjects & archives</Prompt>
          <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">Browse.</h1>
        </div>
        <div className="text-right">
          <div className="label">ON THE BOARD</div>
          <div className="font-mono text-2xl tabular-nums">{totalNotes.toLocaleString("en-ZA")} NOTES</div>
        </div>
      </div>

      <div className="rule" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/district/${s.id}`}
            className="panel p-5 flex flex-col gap-3 no-underline hover:bg-ink hover:text-paper transition-colors"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-label text-mark">{s.id.toUpperCase()}</span>
              <span className="font-mono text-[12px] tabular-nums shrink-0">{String(s.noteCount).padStart(3, "0")} NOTES</span>
            </div>
            <div className="font-medium text-lg leading-tight">{s.name}</div>
            <p className="text-mute text-[13px] leading-relaxed flex-1">{s.blurb}</p>
            <div className="mt-auto flex items-center gap-2 label !text-[9px]">
              Enter archive <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      <p className="label text-center pt-4">
        {subjects.length} SUBJECTS · CAPS ALIGNED · EVERY APPROVED NOTE EARNS ITS UPLOADER PTS
      </p>
    </div>
  );
}
