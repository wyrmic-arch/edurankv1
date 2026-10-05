"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, FileText, GraduationCap, ShieldAlert, Sparkles, Ticket, X } from "lucide-react";
import { api, type AdminPendingNote, type AdminStats, type AdminRejectedNote, type PromotionRow, type ReportRow, type StaffInvite, type School } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { ErrorPanel, Spinner } from "@/components/hud";
import { InviteLink, CopyLinkButton } from "@/components/invite-link";
import { fileSize, timeAgo } from "@/lib/format";

export default function AdminPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState<AdminPendingNote[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const load = useCallback(() => {
    Promise.all([api.adminPending(), api.adminStats()])
      .then(([p, s]) => {
        setPending(p.items);
        setStats(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  async function act(note: AdminPendingNote, action: "approve" | "reject") {
    setError(null);
    setBusyId(note.id);
    try {
      if (action === "approve") await api.approve(note.id);
      else await api.reject(note.id, reason || "Didn't meet quality standards.");
      setRejecting(null);
      setReason("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function previewFile(note: AdminPendingNote) {
    // Open the tab inside the click gesture so the popup isn't blocked, then
    // point it at the authorised blob (Bearer header, not an unauthenticated URL).
    const tab = window.open("about:blank", "_blank");
    try {
      const blob = await api.downloadNote(note.id);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
    } catch (e) {
      if (tab) tab.close();
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  }

  if (!user) return <Spinner />;
  if (user.role !== "admin" && user.role !== "owner") {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <ShieldAlert className="w-10 h-10 mx-auto text-mark mb-4" />
        <h1 className="font-serif text-3xl font-medium">Restricted area.</h1>
        <p className="text-mute mt-2 text-[13px]">This area is staff-only.</p>
      </div>
    );
  }

  if (error && !pending) return <ErrorPanel message={error} onRetry={load} />;
  if (pending === null) return <Spinner label="OPENING THE REVIEW DESK…" />;

  return (
    <div className="space-y-8">
      <div>
        <div className="label inline-flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5 text-mark" /> STAFF ONLY</div>
        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">Review desk.</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Stat label="PENDING" value={String(stats.pending)} />
          <Stat label="APPROVED" value={String(stats.approved)} />
          <Stat label="REJECTED" value={String(stats.rejected)} />
          <Stat label="PLAYERS" value={String(stats.players)} />
          <Stat label="PTS EARNED (ALL)" value={stats.pointsEarnedAllTime.toLocaleString("en-ZA")} />
        </div>
      )}

      {error && <ErrorPanel message={error} />}

      <div className="rule" />

      {pending.length === 0 ? (
        <p className="text-mute text-[13px] py-10 text-center border border-dashed border-ruleSoft">
          Queue clear. The city is fully moderated.
        </p>
      ) : (
        <ul className="space-y-4">
          {pending.map((n) => (
            <li key={n.id} className="panel p-5">
              <div className="flex flex-wrap items-start gap-4">
                <span className="w-11 h-11 shrink-0 flex items-center justify-center border border-cinder">
                  <FileText className="w-5 h-5 text-mute" />
                </span>
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-medium">{n.title}</h3>
                    <span className="font-mono text-[10px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">{n.subjectName.toUpperCase()}</span>
                    <span className="font-mono text-[10px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">GR {n.grade}</span>
                  </div>
                  <p className="text-mute text-[13px] mt-1 line-clamp-2">{n.description}</p>
                  <div className="label !text-[9px] mt-2">
                    BY {n.uploaderName.toUpperCase()} · {timeAgo(n.createdAt)} · {n.fileName} ({fileSize(n.fileSize)})
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 ml-auto w-full sm:w-auto">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => void previewFile(n)} disabled={busyId === n.id} className="btn-ghost">PREVIEW</button>
                    <button onClick={() => void act(n, "approve")} disabled={busyId === n.id} className="btn-solid">
                      <Check className="w-4 h-4" /> {busyId === n.id ? "…" : "APPROVE"}
                    </button>
                    <button onClick={() => setRejecting(rejecting === n.id ? null : n.id)} disabled={busyId === n.id} className="btn-ghost">
                      <X className="w-4 h-4" /> REJECT
                    </button>
                  </div>
                  {rejecting === n.id && (
                    <div className="flex gap-2">
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason (sent to uploader)"
                        className="flex-1 px-3 py-2 text-[12px]"
                      />
                      <button onClick={() => void act(n, "reject")} disabled={busyId === n.id} className="btn-mark">
                        CONFIRM
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rule" />
      <AiCheck />
      <RejectedQueue />

      <div className="rule" />
      <StaffAdmin />

      <div className="rule" />
      <ReportsAdmin />
    </div>
  );
}

function ReportsAdmin() {
  const [items, setItems] = useState<ReportRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  function load() {
    api.adminReports().then((r) => setItems(r.items)).catch(() => {});
  }
  useEffect(load, []);
  async function resolve(id: string, action: "dismiss" | "remove") {
    setBusy(id);
    try {
      await api.adminResolveReport(id, action);
      load();
    } finally {
      setBusy(null);
    }
  }
  return (
    <div>
      <div className="label inline-flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5" /> CONTENT REPORTS</div>
      <ul className="mt-4 panel divide-y divide-ruleSoft">
        {items.length === 0 ? (
          <li className="p-4 text-mute text-[13px]">No open reports.</li>
        ) : (
          items.map((r) => (
            <li key={r.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <Link href={`/notes/${r.noteId}`} className="font-medium no-underline hover:text-accent">{r.noteTitle}</Link>
                <div className="label !text-[9px] mt-1">{r.reason} · by {r.reporterName}</div>
              </div>
              <button onClick={() => void resolve(r.id, "dismiss")} disabled={busy === r.id} className="btn-ghost !text-[10px]">DISMISS</button>
              <button onClick={() => void resolve(r.id, "remove")} disabled={busy === r.id} className="btn-mark !text-[10px]">REMOVE NOTE</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function StaffAdmin() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [promos, setPromos] = useState<PromotionRow[] | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function reload() {
    api.adminInvites().then((r) => setInvites(r.items)).catch(() => {});
    api.adminPromotions().then((r) => setPromos(r.rows)).catch(() => {});
  }
  useEffect(() => {
    api.schools().then((r) => setSchools(r.items)).catch(() => {});
    reload();
  }, []);

  async function createPrincipal() {
    if (!schoolId) return;
    setErr(null);
    try {
      const { code } = await api.adminCreateInvite("principal", schoolId);
      setCreatedCode(code);
      setFlash("Principal invite created — send them the link below.");
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function runPromotions() {
    setErr(null);
    setFlash(null);
    try {
      const r = await api.adminRunPromotions();
      setFlash(`Promotions run — ${r.promoted} promoted, ${r.heldBack} held back, ${r.graduated} graduated.`);
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="label inline-flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" /> PROMOTIONS</div>
        <p className="text-mute text-[13px] mt-2">
          End-of-year rollover. Everyone advances a grade unless a principal marked them to repeat; grade 12 becomes alumni.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          {(promos ?? []).map((p) => (
            <div key={p.grade} className="hairline px-3 py-2">
              <div className="label !text-[9px]">GR {p.grade}</div>
              <div className="font-mono text-sm mt-1">
                {p.total} · <span className="text-accent">{p.graduating ? "GRAD" : `→${p.nextGrade}`}</span>
                {p.heldBack > 0 && <span className="text-mute"> ({p.heldBack} repeat)</span>}
              </div>
            </div>
          ))}
          {(promos ?? []).length === 0 && <div className="text-mute text-[13px]">No graded students.</div>}
        </div>
        <button onClick={() => void runPromotions()} className="btn-mark !text-[11px] mt-4">RUN PROMOTIONS</button>
      </div>

      <div>
        <div className="label inline-flex items-center gap-2"><Ticket className="w-3.5 h-3.5" /> PRINCIPAL INVITES</div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="px-3 py-2 text-[13px] max-w-[280px]">
            <option value="">Pick a school…</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button onClick={() => void createPrincipal()} disabled={!schoolId} className="btn-solid !text-[11px]">CREATE PRINCIPAL INVITE</button>
        </div>
        {flash && <p className="text-accent text-[12px] mt-3">{flash}</p>}
        {err && <p className="text-mark text-[12px] mt-3">{err}</p>}
        {createdCode && (
          <div className="border border-accent bg-oil p-3 space-y-2 mt-3">
            <div className="label !text-[9px] text-accent">PRINCIPAL INVITE LINK</div>
            <InviteLink code={createdCode} />
            <p className="text-mute text-[11px]">Send this link to the principal you&rsquo;re inviting.</p>
          </div>
        )}
        <ul className="mt-4 panel divide-y divide-ruleSoft max-h-64 overflow-y-auto">
          {invites.length === 0 ? (
            <li className="p-3 text-mute text-[12px]">No invites yet.</li>
          ) : (
            invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-2">
                <span className="font-mono text-[12px] tracking-widest">{i.code}</span>
                <span className="label !text-[9px] flex-1 truncate">{i.role.toUpperCase()} · {i.schoolName}</span>
                {!i.used && <CopyLinkButton code={i.code} />}
                <span className="label !text-[9px]">{i.used ? "USED" : "OPEN"}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function AiCheck() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "bad">("idle");
  const [msg, setMsg] = useState("");
  async function run() {
    setState("loading");
    setMsg("");
    try {
      const r = await api.adminAiCheck();
      if (r.ok) {
        setState("ok");
        setMsg(`Working — the model replied “${r.sample ?? ""}”.`);
      } else {
        setState("bad");
        setMsg(r.error ?? "AI check failed.");
      }
    } catch (e) {
      setState("bad");
      setMsg(e instanceof Error ? e.message : "AI check failed.");
    }
  }
  return (
    <div className="panel p-4 flex flex-wrap items-center gap-3">
      <div className="label inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-accent" /> AI MODERATION</div>
      <p className="flex-1 min-w-[220px] text-[12px] text-mute">
        New notes are auto-reviewed by Cloudflare Workers AI (and a hard rule set for exam papers). Test it here.
      </p>
      <button onClick={() => void run()} disabled={state === "loading"} className="btn-ghost !text-[10px]">
        {state === "loading" ? "TESTING…" : "TEST AI"}
      </button>
      {msg && <span className={`text-[11px] ${state === "ok" ? "text-accent" : "text-mark"}`}>{msg}</span>}
    </div>
  );
}

function RejectedQueue() {
  const [items, setItems] = useState<AdminRejectedNote[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  function load() {
    api.adminRejected().then((r) => setItems(r.items)).catch(() => setItems([]));
  }
  useEffect(load, []);
  async function restore(id: string) {
    setBusy(id);
    try {
      await api.adminRestore(id);
      load();
    } finally {
      setBusy(null);
    }
  }
  if (items === null) return <Spinner label="LOADING REJECTED…" />;
  return (
    <div>
      <div className="label inline-flex items-center gap-2"><X className="w-3.5 h-3.5 text-mark" /> REJECTED ({items.length})</div>
      {items.length === 0 ? (
        <p className="text-mute text-[13px] mt-3">Nothing has been rejected.</p>
      ) : (
        <ul className="panel divide-y divide-ruleSoft mt-4">
          {items.map((n) => (
            <li key={n.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium">{n.title}</span>
                    <span className="label !text-[9px] border border-ruleSoft px-2 py-0.5">{n.subjectName.toUpperCase()} · GR {n.grade}</span>
                  </div>
                  <p className="text-mark text-[12px] mt-1.5">{n.reviewNote ?? "No reason recorded."}</p>
                  <div className="label !text-[9px] mt-1.5">
                    BY {n.uploaderName.toUpperCase()} · {timeAgo(n.createdAt)}
                    {n.reviewedAt ? ` · REVIEWED ${timeAgo(n.reviewedAt)}` : ""}
                  </div>
                </div>
                <button onClick={() => void restore(n.id)} disabled={busy === n.id} className="btn-ghost !text-[10px]">
                  {busy === n.id ? "…" : "RESTORE"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="font-mono text-2xl tabular-nums mt-1">{value}</div>
    </div>
  );
}