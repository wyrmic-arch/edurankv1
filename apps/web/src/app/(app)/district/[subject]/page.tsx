"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, type Note, type Subject } from "@/lib/api";
import { ErrorPanel, EmptyState, Spinner } from "@/components/hud";
import { NoteCard } from "@/components/notecard";
import { GRADES } from "@edurank/shared";

export const runtime = "edge";

const SORTS = [
  { key: "recent", label: "NEWEST" },
  { key: "downloads", label: "MOST DOWNLOADED" },
  { key: "top", label: "TOP RATED" },
] as const;

export default function DistrictPage() {
  const { subject: subjectId } = useParams<{ subject: string }>();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [sort, setSort] = useState<string>("recent");
  const [q, setQ] = useState("");

  useEffect(() => {
    api.subjects().then((r) => setSubjects(r.items)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let live = true;
    setNotes(null);
    setError(null);
    api
      .notes({ subject: subjectId, grade: grade || undefined, sort, q: q || undefined })
      .then((r) => live && setNotes(r.items))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [subjectId, grade, sort, q]);

  const subject = useMemo(() => subjects?.find((s) => s.id === subjectId), [subjects, subjectId]);

  if (subjects && !subject) {
    return (
      <EmptyState
        title="Unknown subject."
        hint="That subject isn't open yet."
        action={<Link href="/" className="btn-solid">Back to the board</Link>}
      />
    );
  }
  if (!subject || (notes === null && !error)) return <Spinner label="OPENING SUBJECT…" />;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="label">SUBJECT · {subject.id.toUpperCase()}</div>
          <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">{subject.name}</h1>
          <p className="text-mute text-[14px] mt-3 max-w-xl">{subject.blurb}</p>
        </div>
        <div className="text-right">
          <div className="label">SUBJECT</div>
          <div className="font-mono text-2xl tabular-nums">{String(subject.noteCount).padStart(3, "0")} NOTES</div>
        </div>
      </div>

      <div className="rule" />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <FilterPill active={grade === ""} onClick={() => setGrade("")}>ALL GRADES</FilterPill>
          {GRADES.map((g) => (
            <FilterPill key={g} active={grade === String(g)} onClick={() => setGrade(String(g))}>GR {g}</FilterPill>
          ))}
        </div>

        <div className="ml-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search this subject…"
            className="px-3 py-2 text-[13px] w-64"
          />
        </div>
      </div>

      <div className="flex gap-1 -mt-3">
        {SORTS.map((s) => (
          <FilterPill key={s.key} active={sort === s.key} onClick={() => setSort(s.key)}>
            {s.label}
          </FilterPill>
        ))}
      </div>

      {error ? (
        <ErrorPanel message={error} onRetry={() => setSort(sort)} />
      ) : notes === null ? (
        <Spinner label="SCANNING THE ARCHIVE…" />
      ) : notes.length === 0 ? (
        <EmptyState
          title="No notes on this block yet."
          hint="Be the first supplier in this subject — approved uploads earn PTS every time someone downloads."
          action={<Link href="/upload" className="btn-solid">Upload a note</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 border transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-ruleSoft text-mute hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}