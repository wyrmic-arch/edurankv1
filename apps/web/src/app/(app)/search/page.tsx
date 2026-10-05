"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { api, type Note } from "@/lib/api";
import { NoteCard } from "@/components/notecard";
import { Spinner } from "@/components/hud";

export default function SearchPage() {
  return (
    <Suspense fallback={<Spinner label="SEARCHING…" />}>
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState("recent");
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setNotes([]);
      setError(null);
      return;
    }
    let live = true;
    setNotes(null);
    setError(null);
    const t = setTimeout(() => {
      api
        .notes({ q: term, sort })
        .then((r) => live && setNotes(r.items))
        .catch((e) => live && setError(e instanceof Error ? e.message : "Search failed"));
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, sort]);

  return (
    <div className="space-y-6">
      <div>
        <div className="label inline-flex items-center gap-2">
          <SearchIcon className="w-3.5 h-3.5" /> SEARCH
        </div>
        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">Find a note.</h1>
      </div>

      <div className="rule" />

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative block flex-1 min-w-[220px]">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes by title, topic or description…"
            className="w-full pl-9 pr-3 py-2.5 text-[14px]"
          />
        </label>
        {(["recent", "downloads", "top"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 border transition-colors ${
              sort === s ? "border-ash bg-ash text-night" : "border-cinder text-ghost hover:border-ash hover:text-ash"
            }`}
          >
            {s === "recent" ? "NEWEST" : s === "downloads" ? "MOST DOWNLOADED" : "TOP RATED"}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-mark text-[13px] border border-mark bg-mark/5 px-3 py-2">{error}</p>
      ) : notes === null ? (
        <Spinner label="SEARCHING…" />
      ) : q.trim() === "" ? (
        <p className="text-mute text-[13px] py-10 text-center border border-dashed border-ruleSoft">
          Start typing to search every approved note in your grade.
        </p>
      ) : notes.length === 0 ? (
        <p className="text-mute text-[13px] py-10 text-center border border-dashed border-ruleSoft">
          No notes match &ldquo;{q.trim()}&rdquo;.
        </p>
      ) : (
        <>
          <p className="label">{notes.length} RESULT{notes.length === 1 ? "" : "S"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
