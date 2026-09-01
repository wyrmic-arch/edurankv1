"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, FileText, ShieldAlert, X } from "lucide-react";
import { api, type AdminPendingNote, type AdminStats } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { ErrorPanel, PTS, Spinner } from "@/components/hud";
import { fileSize, timeAgo } from "@/lib/format";

export default function AdminPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState<AdminPendingNote[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    Promise.all([api.adminPending(), api.adminStats()])
      .then(([p, s]) => {
        setPending(p.items);
        setStats(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  async function act(note: AdminPendingNote, action: "approve" | "reject") {
    setError(null);
    try {
      if (action === "approve") await api.approve(note.id);
      else await api.reject(note.id, reason || "Didn't meet quality standards.");
      setRejecting(null);
      setReason("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  }

  // Admins pass the gate on /notes/:id/file — fetch with auth, open as blob.
  async function previewFile(note: AdminPendingNote) {
    try {
      const res = await fetch(api.fileUrl(note.id), {
        headers: { Authorization: `Bearer ${localStorage.getItem("edurank_token")}` },
      });
      if (!res.ok) throw new Error(`Preview failed (${res.status})`);
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  }

  if (!user) return <Spinner />;
  if (user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <ShieldAlert className="w-10 h-10 mx-auto text-blood mb-4" />
        <h1 className="font-display uppercase text-3xl">Restricted area</h1>
        <p className="text-mute mt-2 text-sm">This wing of the city is staff-only. Your file doesn&apos;t clear the gate.</p>
      </div>
    );
  }

  if (error && !pending) return <ErrorPanel message={error} onRetry={load} />;
  if (pending === null) return <Spinner label="OPENING THE REVIEW DESK…" />;

  return (
    <div className="space-y-6">
      <div>
        <div className="hud-label mb-1 inline-flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5 text-blood" /> STAFF ONLY</div>
        <h1 className="font-display uppercase text-4xl">Review desk</h1>
      </div>

      {/* stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Stat label="PENDING" value={String(stats.pending)} tone="gold" />
          <Stat label="APPROVED" value={String(stats.approved)} tone="volt" />
          <Stat label="REJECTED" value={String(stats.rejected)} />
          <Stat label="PLAYERS" value={String(stats.players)} />
          <Stat label="PTS EARNED (ALL)" value={stats.pointsEarnedAllTime.toLocaleString("en-ZA")} />
        </div>
      )}

      {error && <ErrorPanel message={error} />}

      {pending.length === 0 ? (
        <p className="text-mute text-sm py-10 text-center border border-dashed border-line clip-hud">
          Queue clear. The city is fully moderated.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((n) => (
            <li key={n.id} className="panel p-5">
              <div className="flex flex-wrap items-start gap-4">
                <span className="w-11 h-11 shrink-0 flex items-center justify-center border border-line bg-surface-2 clip-hud-sm">
                  <FileText className="w-5 h-5 text-mute" />
                </span>
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{n.title}</h3>
                    <span className="chip">{n.subjectName.toUpperCase()}</span>
                    <span className="chip">GR {n.grade}</span>
                  </div>
                  <p className="text-mute text-sm mt-1 line-clamp-2">{n.description}</p>
                  <div className="hud-label mt-2 !text-[9px]">
                    BY {n.uploaderName.toUpperCase()} · {timeAgo(n.createdAt)} · {n.fileName} ({fileSize(n.fileSize)})
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 ml-auto w-full sm:w-auto">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => void previewFile(n)} className="btn-ghost !py-2 text-xs">PREVIEW</button>
                    <button onClick={() => void act(n, "approve")} className="btn-volt !py-2 text-xs flex-1 sm:flex-none">
                      <Check className="w-4 h-4" /> APPROVE
                    </button>
                    <button onClick={() => setRejecting(rejecting === n.id ? null : n.id)} className="btn-ghost !py-2 text-xs !border-blood/40 !text-blood">
                      <X className="w-4 h-4" /> REJECT
                    </button>
                  </div>
                  {rejecting === n.id && (
                    <div className="flex gap-2">
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason (sent to uploader)"
                        className="flex-1 px-3 py-2 clip-hud-sm text-xs"
                      />
                      <button onClick={() => void act(n, "reject")} className="btn !bg-blood !border-blood !text-void !py-2 text-xs">
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
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "volt" | "gold" }) {
  return (
    <div className="panel p-3">
      <div className="hud-label !text-[9px]">{label}</div>
      <div className={`font-mono text-xl font-bold mt-1 ${tone === "gold" ? "text-gold" : tone === "volt" ? "text-volt" : "text-ink"}`}>{value}</div>
    </div>
  );
}
