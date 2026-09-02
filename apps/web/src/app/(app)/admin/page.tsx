"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, FileText, ShieldAlert, X } from "lucide-react";
import { api, type AdminPendingNote, type AdminStats } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { ErrorPanel, Spinner } from "@/components/hud";
import { fileSize, timeAgo } from "@/lib/format";

export default function AdminPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState<AdminPendingNote[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
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

  async function previewFile(note: AdminPendingNote) {
    try {
      const res = await fetch(api.fileUrl(note.id), {
        headers: { Authorization: `Bearer ${localStorage.getItem("edurank_token")}` },
      });
      if (!res.ok) throw new Error(`Preview failed (${res.status})`);
      const blob = await res.blob();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  }

  if (!user) return <Spinner />;
  if (user.role !== "admin") {
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
                <span className="w-11 h-11 shrink-0 flex items-center justify-center border border-ink">
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
                    <button onClick={() => void previewFile(n)} className="btn-ghost">PREVIEW</button>
                    <button onClick={() => void act(n, "approve")} className="btn-solid">
                      <Check className="w-4 h-4" /> APPROVE
                    </button>
                    <button onClick={() => setRejecting(rejecting === n.id ? null : n.id)} className="btn-ghost">
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
                      <button onClick={() => void act(n, "reject")} className="btn-mark">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="font-mono text-2xl tabular-nums mt-1">{value}</div>
    </div>
  );
}