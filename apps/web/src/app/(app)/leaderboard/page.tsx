"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Crown } from "lucide-react";
import { api, type LeaderRow, type Subject, type School } from "@/lib/api";
import { Avatar, TierChip } from "@/components/avatar";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";

type Scope = "global" | "subject" | "school";
type Range = "weekly" | "all-time";

export default function LeaderboardPage() {
  const params = useSearchParams();
  const [scope, setScope] = useState<Scope>((params.get("scope") as Scope) ?? "global");
  const [range, setRange] = useState<Range>("weekly");
  const [subjectId, setSubjectId] = useState(params.get("subjectId") ?? "");
  const [schoolId, setSchoolId] = useState(params.get("schoolId") ?? "");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.subjects().then((r) => setSubjects(r.items)).catch(() => {});
    api.schools().then((r) => setSchools(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    let live = true;
    setRows(null);
    setError(null);
    if (scope === "subject" && !subjectId) return setRows([]);
    if (scope === "school" && !schoolId) return setRows([]);
    api
      .leaderboard(scope, range, scope === "subject" ? { subjectId } : scope === "school" ? { schoolId } : undefined)
      .then((r) => live && setRows(r.items))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [scope, range, subjectId, schoolId]);

  const podium = rows?.slice(0, 3) ?? [];
  const rest = rows?.slice(3) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <div className="label">NATIONAL STANDINGS</div>
        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">The board.</h1>
      </div>

      <div className="rule" />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {(["global", "subject", "school"] as Scope[]).map((s) => (
            <Tab key={s} active={scope === s} onClick={() => setScope(s)}>
              {s === "global" ? "GLOBAL" : s.toUpperCase()}
            </Tab>
          ))}
        </div>
        <div className="text-ruleSoft">·</div>
        <div className="flex gap-1">
          {(["weekly", "all-time"] as Range[]).map((r) => (
            <Tab key={r} active={range === r} onClick={() => setRange(r)}>
              {r === "weekly" ? "THIS WEEK" : "ALL-TIME"}
            </Tab>
          ))}
        </div>

        {scope === "subject" && (
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="ml-auto px-3 py-2 text-[13px]">
            <option value="">Pick a subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        {scope === "school" && (
          <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="ml-auto px-3 py-2 text-[13px]">
            <option value="">Pick a school…</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {error ? (
        <ErrorPanel message={error} onRetry={() => setRange(range)} />
      ) : rows === null ? (
        <Spinner label="TALLYING THE BOARD…" />
      ) : (scope === "subject" && !subjectId) || (scope === "school" && !schoolId) ? (
        <p className="text-mute py-10 text-center text-[13px]">Select a {scope} above to load its board.</p>
      ) : rows.length === 0 ? (
        <p className="text-mute py-10 text-center text-[13px]">No ranked players here yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 0, 2].map((slot) => {
              const row = podium[slot];
              if (!row) return null;
              return (
                <Link
                  key={row.userId}
                  href={`/profile/${row.userId}`}
                  className={`panel p-6 flex flex-col items-start text-left gap-2 no-underline hover:bg-ink hover:text-paper transition-colors ${slot === 0 ? "border-mark" : ""}`}
                >
                  <div className="flex items-baseline justify-between w-full">
                    <span className="label">#{String(row.rank).padStart(2, "0")}</span>
                    {slot === 0 && <Crown className="w-4 h-4 text-mark" />}
                  </div>
                  <Avatar name={row.displayName} avatarUrl={row.avatarUrl} size={48} />
                  <div className="font-medium truncate max-w-full">{row.displayName}</div>
                  <TierChip totalEarned={row.points} />
                  <PTS value={row.points} size="lg" />
                  <span className="label !text-[9px]">{row.schoolName ?? "NO SCHOOL"}</span>
                </Link>
              );
            })}
          </div>

          <ol className="panel divide-y divide-ruleSoft">
            {rest.map((row) => (
              <li key={row.userId}>
                <Link href={`/profile/${row.userId}`} className="flex items-baseline gap-4 px-5 py-3 hover:bg-ink hover:text-paper no-underline transition-colors">
                  <span className="font-mono text-[12px] text-mute w-10 shrink-0">#{String(row.rank).padStart(2, "0")}</span>
                  <Avatar name={row.displayName} avatarUrl={row.avatarUrl} size={28} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{row.displayName}</span>
                    <span className="block label !text-[9px] truncate">
                      {row.schoolName ?? "no school"}{row.grade ? ` · GR ${row.grade}` : ""}
                    </span>
                  </span>
                  <PTS value={row.points} />
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[11px] uppercase tracking-label px-3 py-1.5 border transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-ruleSoft text-mute hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}