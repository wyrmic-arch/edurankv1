"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, ShieldCheck, ThumbsUp, User } from "lucide-react";
import { api, imgUrl, type Note, type NoteVerification } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";
import { fileSize, timeAgo } from "@/lib/format";
import { POINTS_RULES, licenseLabel, isStaffRole } from "@edurank/shared";

export const runtime = "edge";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setUser, user } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [verifications, setVerifications] = useState<NoteVerification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("Stolen content");
  const [reportFlash, setReportFlash] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(() => {
    api.note(id).then((r) => { setNote(r.note); setVerifications(r.verifications ?? []); }).catch((e) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  async function verify(verdict: "correct" | "needs_work") {
    if (!note || verifying) return;
    setVerifying(true);
    setFlash(null);
    try {
      await api.verifyNote(note.id, verdict, verdict === "needs_work" ? "Needs a re-check." : "");
      load();
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "Could not record verification");
    } finally {
      setVerifying(false);
    }
  }

  async function unlock() {
    if (!note) return;
    setBusy(true);
    setFlash(null);
    try {
      const res = await api.unlock(note.id);
      setUser((u) => (u ? { ...u, balance: res.balanceAfter } : u));
      setFlash(res.pricePaid > 0 ? `Unlocked for ${res.pricePaid} PTS. Yours forever.` : "Claimed for free.");
      load();
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  async function openFile() {
    if (!note || downloading) return;
    // Open the tab synchronously (inside the click gesture) so it isn't
    // popup-blocked, then point it at the authenticated blob once it arrives.
    const tab = window.open("about:blank", "_blank");
    setDownloading(true);
    setFlash(null);
    try {
      const blob = await api.downloadNote(note.id);
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch (e) {
      if (tab) tab.close();
      setFlash(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function upvote() {
    if (!note || upvoting) return;
    const wasUpvoted = note.upvotedByMe;
    const previousCount = note.upvoteCount;
    setUpvoting(true);
    setNote({ ...note, upvotedByMe: !wasUpvoted, upvoteCount: wasUpvoted ? previousCount - 1 : previousCount + 1 });
    try {
      const res = await api.upvote(note.id);
      setNote((n) => (n ? { ...n, upvotedByMe: res.upvotedByMe, upvoteCount: res.upvoteCount } : n));
    } catch (e) {
      setNote((n) => (n ? { ...n, upvotedByMe: wasUpvoted, upvoteCount: previousCount } : n));
      setFlash(e instanceof Error ? e.message : "Upvote failed");
    } finally {
      setUpvoting(false);
    }
  }

  async function submitReport() {
    if (!note) return;
    setReportFlash(null);
    try {
      await api.reportNote(note.id, reportReason);
      setReportFlash("Reported — our team will review it.");
      setReporting(false);
    } catch (e) {
      setReportFlash(e instanceof Error ? e.message : "Could not report");
    }
  }

  if (error) return <ErrorPanel message={error} onRetry={() => router.refresh()} />;
  if (!note) return <Spinner label="PULLING THE FILE…" />;

  const art = note.coverUrl ? imgUrl(note.coverUrl) : imgUrl(`/img/subject/${note.subjectId}`);
  const canDownload = note.canViewFile ?? (note.unlockedByMe || note.ownedByMe || user?.role === "admin");
  const isStaff = user ? isStaffRole(user.role) : false;

  return (
    <div className="grid lg:grid-cols-[5fr_7fr] gap-8 items-start">
      <div className="space-y-3 lg:sticky lg:top-20">
        <div className="relative hairline overflow-hidden aspect-video bg-ruleSoft">
          {art && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" loading="lazy" />
          )}
          <div className="absolute inset-0 bg-night/30" />
          <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-label px-2 py-0.5 border border-cinder bg-oil text-ash">
            GR {note.grade} · {note.subjectId.toUpperCase()}
          </span>
        </div>

        <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="label">FILE</div>
            <div className="font-mono text-[13px] mt-1 truncate max-w-[220px]">{note.fileName}</div>
            <div className="label !text-[9px] mt-1">{fileSize(note.fileSize ?? 0)} · {timeAgo(note.createdAt)}</div>
          </div>
          {canDownload ? (
            <button onClick={openFile} disabled={downloading || busy} className="btn-solid">
              {downloading ? "LOADING…" : "OPEN FILE"} <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={unlock} disabled={busy} className="btn-mark">
              {busy ? "PROCESSING…" : note.isFree ? "CLAIM — FREE" : `UNLOCK · ${note.pricePoints} PTS`}
            </button>
          )}
        </div>

        {flash && (
          <div className="hairline border-cinder px-4 py-2.5 text-[13px]">{flash}</div>
        )}
      </div>

      <div>
        {!note.isFree && !canDownload && (
          <div className="mb-6 hairline border-mark px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-[13px]">Premium drop. One payment, lifetime access.</p>
            <PTS value={note.pricePoints} tone="mark" size="lg" />
          </div>
        )}

        <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">{note.title}</h1>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Link href={`/profile/${note.uploaderId}`} className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5 no-underline hover:border-ash">
            <User className="w-3 h-3 inline-block mr-1" />{note.uploaderName}
          </Link>
          <Link href={`/district/${note.subjectId}`} className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5 no-underline hover:border-ash">
            {note.subjectId.toUpperCase()}
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">GR {note.grade}</span>
          {note.topic && <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">{note.topic}</span>}
          <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">{licenseLabel(note.license)}</span>
          {note.verifiedByTeacher && (
            <span className="font-mono text-[11px] uppercase tracking-label border border-accent text-accent px-2 py-0.5 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> TEACHER VERIFIED
            </span>
          )}
          {note.isOfficial && note.slug && (
            <Link
              href={`/study/${note.grade}/${note.subjectId}/${note.slug}`}
              className="font-mono text-[11px] uppercase tracking-label border border-accent text-accent px-2 py-0.5 no-underline inline-flex items-center gap-1"
            >
              OFFICIAL · READ →
            </Link>
          )}
        </div>

        <p className="text-mute leading-relaxed mt-6 whitespace-pre-wrap">{note.description}</p>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={upvote}
            disabled={note.ownedByMe || upvoting}
            className={`btn ${note.upvotedByMe ? "border-ash bg-ash text-night" : ""}`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="font-mono">{note.upvoteCount}</span>
          </button>
          <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">
            <Download className="w-3 h-3 inline-block mr-1" />{note.downloadCount} downloads
          </span>
          {user?.role === "admin" && (
            <span className="font-mono text-[11px] uppercase tracking-label border border-mark text-mark px-2 py-0.5">
              STATUS: {note.status.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Link href={`/verify/${note.id}`} className="font-mono text-[10px] uppercase tracking-label border border-ruleSoft px-2 py-1 no-underline hover:border-ash">
            CERTIFICATE
          </Link>
          <button onClick={() => setReporting((v) => !v)} className="font-mono text-[10px] uppercase tracking-label border border-ruleSoft px-2 py-1 hover:border-mark hover:text-mark">
            REPORT STOLEN
          </button>
          {reportFlash && <span className="text-accent text-[11px]">{reportFlash}</span>}
        </div>
        {reporting && (
          <div className="panel p-3 mt-3 flex flex-wrap items-center gap-2">
            <input value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="flex-1 min-w-[220px] px-3 py-2 text-[12px]" placeholder="Why are you reporting this?" />
            <button onClick={() => void submitReport()} className="btn-mark !text-[10px]">SEND REPORT</button>
          </div>
        )}

        {isStaff && note.status === "approved" && (
          <div className="panel p-4 mt-6 space-y-3">
            <div className="label inline-flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-accent" /> TEACHER REVIEW</div>
            <p className="text-mute text-[12px]">
              Free access for your school/subjects — verifying doesn&rsquo;t pay out or count as a download.
            </p>
            <div className="flex gap-2">
              <button onClick={() => void verify("correct")} disabled={verifying} className="btn-solid !text-[11px]">MARK CORRECT</button>
              <button onClick={() => void verify("needs_work")} disabled={verifying} className="btn-ghost !text-[11px]">NEEDS WORK</button>
            </div>
            {verifications.length > 0 && (
              <ul className="space-y-1 pt-1">
                {verifications.map((v, i) => (
                  <li key={i} className="text-[12px] text-mute">
                    <span className={v.verdict === "correct" ? "text-accent" : "text-mark"}>
                      {v.verdict === "correct" ? "CORRECT" : "NEEDS WORK"}
                    </span>
                    {" — "}{v.teacherName}{v.comment ? `: ${v.comment}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="label mt-12">
          EVERY DOWNLOAD PAYS THE UPLOADER PTS · SELLER KEEPS A {Math.round(POINTS_RULES.SELLER_CUT * 100)}% CUT OF PAID UNLOCKS
        </p>
      </div>
    </div>
  );
}