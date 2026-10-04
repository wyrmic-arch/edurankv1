"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, GraduationCap, Plus, ShieldAlert, Ticket } from "lucide-react";
import {
  api,
  type SchoolDashboard,
  type SchoolNote,
  type SchoolStudent,
  type StaffInvite,
  type Subject,
} from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";

type Tab = "overview" | "students" | "notes" | "staff";

export default function SchoolPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  if (!user) return <Spinner />;
  if (user.role !== "principal" && user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <ShieldAlert className="w-10 h-10 mx-auto text-mark mb-4" />
        <h1 className="font-serif text-3xl font-medium">Principals only.</h1>
        <p className="text-mute mt-2 text-[13px]">This area is for school principals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="label inline-flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5 text-accent" /> SCHOOL DESK
        </div>
        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">Your school.</h1>
      </div>

      <div className="flex gap-1 flex-wrap">
        {(["overview", "students", "notes", "staff"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-mono text-[11px] uppercase tracking-label px-4 py-2 border transition-colors ${
              tab === t ? "border-ash bg-ash text-night" : "border-cinder text-ghost hover:border-ash hover:text-ash"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "students" && <Students />}
      {tab === "notes" && <Notes />}
      {tab === "staff" && <Staff />}
    </div>
  );
}

function Overview() {
  const [data, setData] = useState<SchoolDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.schoolDashboard().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);
  if (error) return <ErrorPanel message={error} />;
  if (!data) return <Spinner label="LOADING SCHOOL…" />;

  const max = Math.max(1, ...data.byGrade.map((g) => g.students));
  return (
    <div className="space-y-8">
      <div className="hairline p-5">
        <div className="font-serif text-2xl font-medium tracking-tight">{data.school.name}</div>
        <div className="label !text-[9px] mt-1">
          {data.school.city ? `${data.school.city.toUpperCase()} · ` : ""}
          {data.school.province.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="STUDENTS" value={data.stats.students.toLocaleString("en-ZA")} />
        <Stat label="NOTES APPROVED" value={data.stats.notesApproved.toLocaleString("en-ZA")} />
        <Stat label="NOTES PENDING" value={data.stats.notesPending.toLocaleString("en-ZA")} />
        <Stat label="SCHOOL PTS" value={data.stats.points.toLocaleString("en-ZA")} />
      </div>

      <div>
        <div className="label !text-[9px] mb-3">STUDENTS BY GRADE</div>
        <div className="space-y-2">
          {data.byGrade.length === 0 && <p className="text-mute text-[13px]">No graded students yet.</p>}
          {data.byGrade.map((g) => (
            <div key={g.grade} className="flex items-center gap-3">
              <span className="font-mono text-[11px] w-12 text-mute">GR {g.grade}</span>
              <div className="flex-1 h-2 bg-smoke relative">
                <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${(g.students / max) * 100}%` }} />
              </div>
              <span className="font-mono text-[12px] tabular-nums w-8 text-right">{g.students}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Students() {
  const [items, setItems] = useState<SchoolStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  function load() {
    api.schoolStudents().then((r) => { setItems(r.items); setError(null); }).catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }
  useEffect(load, []);

  async function toggle(s: SchoolStudent) {
    setBusyId(s.id);
    try {
      await api.schoolSetHeldBack(s.id, !s.heldBack);
      setItems((prev) => prev?.map((x) => (x.id === s.id ? { ...x, heldBack: !x.heldBack } : x)) ?? prev);
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <ErrorPanel message={error} onRetry={load} />;
  if (items === null) return <Spinner label="LOADING STUDENTS…" />;
  const filtered = items.filter((s) => `${s.displayName} ${s.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="px-3 py-2 text-[13px] w-64" />
        <span className="label !text-[9px] inline-flex items-center gap-1.5"><GraduationCap className="w-3 h-3" /> Mark a student to REPEAT their year</span>
      </div>
      <ul className="panel divide-y divide-ruleSoft">
        {filtered.length === 0 && <li className="p-4 text-mute text-[13px]">No students match.</li>}
        {filtered.map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-5 py-3">
            <span className="flex-1 min-w-0">
              <span className="block font-medium truncate">{s.displayName}</span>
              <span className="block label !text-[9px] truncate">{s.email}</span>
            </span>
            <span className="font-mono text-[11px] text-mute w-12 text-right">{s.grade ? `GR ${s.grade}` : "—"}</span>
            <PTS value={s.totalEarned} size="sm" />
            <button
              onClick={() => void toggle(s)}
              disabled={busyId === s.id}
              className={`font-mono text-[10px] uppercase tracking-label px-2 py-1 border transition-colors ${
                s.heldBack ? "border-accent text-accent" : "border-cinder text-ghost hover:border-ash hover:text-ash"
              }`}
              title={s.heldBack ? "Un-mark repeat" : "Mark to repeat next year"}
            >
              {s.heldBack ? "REPEATING" : "PASSING"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Notes() {
  const [items, setItems] = useState<SchoolNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.schoolNotes().then((r) => setItems(r.items)).catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);
  if (error) return <ErrorPanel message={error} />;
  if (items === null) return <Spinner label="LOADING NOTES…" />;
  return (
    <ul className="panel divide-y divide-ruleSoft">
      {items.length === 0 && <li className="p-4 text-mute text-[13px]">No notes from your students yet.</li>}
      {items.map((n) => (
        <li key={n.id}>
          <Link href={`/notes/${n.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-ink no-underline">
            <span className="flex-1 min-w-0">
              <span className="block font-medium truncate">{n.title}</span>
              <span className="block label !text-[9px] truncate">
                {n.uploaderName} · {n.subjectName} · GR {n.grade} · {n.status.toUpperCase()}
              </span>
            </span>
            {n.verified && (
              <span className="font-mono text-[9px] uppercase tracking-label border border-accent text-accent px-2 py-0.5 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> VERIFIED
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Staff() {
  const [invites, setInvites] = useState<StaffInvite[] | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.schoolInvites().then((r) => setInvites(r.items)).catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }
  useEffect(() => {
    load();
    api.subjects().then((r) => setSubjects(r.items)).catch(() => {});
  }, []);

  async function create() {
    setCreating(true);
    setFlash(null);
    try {
      const { code } = await api.schoolCreateInvite(picked);
      setFlash(`Teacher invite created: ${code}`);
      setPicked([]);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="panel p-5 space-y-4">
        <div className="label inline-flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> NEW TEACHER INVITE</div>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => {
            const on = picked.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                className={`font-mono text-[10px] uppercase tracking-label px-2.5 py-1.5 border transition-colors ${
                  on ? "border-accent text-accent" : "border-cinder text-ghost hover:border-ash"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        <button onClick={() => void create()} disabled={creating} className="btn-mark !text-[11px]">
          {creating ? "CREATING…" : "CREATE INVITE"}
        </button>
        {flash && <p className="text-[12px] text-accent font-mono">{flash}</p>}
      </div>

      <div>
        <div className="label !text-[9px] mb-3 inline-flex items-center gap-1.5"><Ticket className="w-3 h-3" /> ISSUED INVITES</div>
        <ul className="panel divide-y divide-ruleSoft">
          {invites === null ? (
            <li className="p-4 text-mute text-[13px]">Loading…</li>
          ) : invites.length === 0 ? (
            <li className="p-4 text-mute text-[13px]">No teacher invites yet.</li>
          ) : (
            invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                <span className="font-mono text-[13px] tracking-widest">{i.code}</span>
                <span className="text-mute text-[11px] flex-1 truncate">{i.subjectIds.join(", ") || "all subjects"}</span>
                <span className="label !text-[9px]">{i.used ? "USED" : "OPEN"}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hairline px-4 py-3">
      <div className="label !text-[9px]">{label}</div>
      <div className="font-mono text-2xl tabular-nums mt-1">{value}</div>
    </div>
  );
}
