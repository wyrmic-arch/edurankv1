"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api, type Note, type Subject } from "@/lib/api";
import { imgUrl } from "@/lib/api";
import { ErrorPanel, EmptyState, Spinner } from "@/components/hud";
import { NoteCard } from "@/components/notecard";
import { GRADES } from "@edurank/shared";

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
  const art = imgUrl(`/img/subject/${subjectId}`);

  if (subjects && !subject) {
    return (
      <EmptyState
        title="Unknown district"
        hint="That part of the map isn't zoned yet."
        action={<Link href="/map" className="btn-volt">Back to the map</Link>}
      />
    );
  }
  if (!subject || (notes === null && !error)) return <Spinner label="ENTERING DISTRICT…" />;

  return (
    <div className="space-y-6">
      {/* district banner */}
      <div className="relative clip-hud border border-line overflow-hidden h-44">
        {art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/60 to-transparent" />
        <div className="relative p-6 flex flex-col justify-end h-full">
          <div className="hud-label" style={{ color: subject!.color }}>
            MZANSI CITY · DISTRICT
          </div>
          <h1 className="font-display uppercase text-4xl md:text-5xl leading-none mt-1">{subject!.name}</h1>
          <p className="text-mute text-sm mt-2 max-w-lg">{subject!.blurb}</p>
        </div>
        <div
          className="absolute top-0 right-0 h-full w-1.5"
          style={{ background: subject!.color, boxShadow: `0 0 24px ${subject!.color}` }}
        />
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <FilterPill active={grade === ""} onClick={() => setGrade("")}>ALL GRADES</FilterPill>
          {GRADES.map((g) => (
            <FilterPill key={g} active={grade === String(g)} onClick={() => setGrade(String(g))}>
              GR {g}
            </FilterPill>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search this district…"
            className="pl-8 pr-3 py-2 clip-hud-sm text-sm w-56"
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

      {/* notes grid */}
      {error ? (
        <ErrorPanel message={error} onRetry={() => setSort(sort)} />
      ) : notes === null ? (
        <Spinner label="SCANNING THE ARCHIVE…" />
      ) : notes.length === 0 ? (
        <EmptyState
          title="No notes on this block yet"
          hint="Be the first supplier in this district — approved uploads earn PTS every time someone downloads."
          action={<Link href="/upload" className="btn-volt">Upload a note</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
      className={`font-mono text-[11px] tracking-hud uppercase px-3 py-1.5 border transition-colors clip-hud-sm ${
        active ? "border-volt text-volt bg-volt/10" : "border-line text-mute hover:text-ink hover:border-ink/30"
      }`}
    >
      {children}
    </button>
  );
}
