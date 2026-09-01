"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, ThumbsUp, User } from "lucide-react";
import { api, imgUrl, type Note } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";
import { fileSize, timeAgo } from "@/lib/format";

export const runtime = "edge";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setUser, user } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(() => {
    api.note(id).then((r) => setNote(r.note)).catch((e) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  async function unlock() {
    if (!note) return;
    setBusy(true);
    setFlash(null);
    try {
      const res = await api.unlock(note.id);
      if (user) setUser({ ...user, balance: res.balanceAfter });
      setFlash(res.pricePaid > 0 ? `Unlocked for ${res.pricePaid} PTS. Yours forever.` : "Claimed for free.");
      load();
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  async function upvote() {
    if (!note) return;
    const wasUpvoted = note.upvotedByMe;
    const previousCount = note.upvoteCount;
    setNote({ ...note, upvotedByMe: !wasUpvoted, upvoteCount: wasUpvoted ? previousCount - 1 : previousCount + 1 });
    try {
      const res = await api.upvote(note.id);
      setNote((n) => (n ? { ...n, upvotedByMe: res.upvotedByMe, upvoteCount: res.upvoteCount } : n));
    } catch (e) {
      setNote((n) => (n ? { ...n, upvotedByMe: wasUpvoted, upvoteCount: previousCount } : n));
      setFlash(e instanceof Error ? e.message : "Upvote failed");
    }
  }

  if (error) return <ErrorPanel message={error} onRetry={() => router.refresh()} />;
  if (!note) return <Spinner label="PULLING THE FILE…" />;

  const art = note.coverUrl ? imgUrl(note.coverUrl) : imgUrl(`/img/subject/${note.subjectId}`);
  const canDownload = note.unlockedByMe || note.ownedByMe || user?.role === "admin";

  return (
    <div className="grid lg:grid-cols-[5fr_7fr] gap-8 items-start">
      <div className="space-y-3 lg:sticky lg:top-20">
        <div className="relative hairline overflow-hidden aspect-video bg-ruleSoft">
          {art && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" loading="lazy" />
          )}
          <div className="absolute inset-0 bg-paper/30" />
          <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-label px-2 py-0.5 border border-ink bg-paper">
            GR {note.grade} · {note.subjectId.toUpperCase()}
          </span>
        </div>

        <div className="panel p-4 flex items-center justify-between">
          <div>
            <div className="label">FILE</div>
            <div className="font-mono text-[13px] mt-1 truncate max-w-[220px]">{note.fileName}</div>
            <div className="label !text-[9px] mt-1">{fileSize(note.fileSize ?? 0)} · {timeAgo(note.createdAt)}</div>
          </div>
          {canDownload ? (
            <a href={api.fileUrl(note.id)} target="_blank" rel="noreferrer" className="btn-solid">
              OPEN FILE <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button onClick={unlock} disabled={busy} className="btn-mark">
              {busy ? "PROCESSING…" : note.isFree ? "CLAIM — FREE" : `UNLOCK · ${note.pricePoints} PTS`}
            </button>
          )}
        </div>

        {flash && (
          <div className="hairline border-ink px-4 py-2.5 text-[13px]">{flash}</div>
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
          <Link href={`/profile/${note.uploaderId}`} className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5 no-underline hover:border-ink">
            <User className="w-3 h-3 inline-block mr-1" />{note.uploaderName}
          </Link>
          <Link href={`/district/${note.subjectId}`} className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5 no-underline hover:border-ink">
            {note.subjectId.toUpperCase()}
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">GR {note.grade}</span>
          {note.topic && <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">{note.topic}</span>}
        </div>

        <p className="text-mute leading-relaxed mt-6 whitespace-pre-wrap">{note.description}</p>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={upvote}
            disabled={note.ownedByMe}
            className={`btn ${note.upvotedByMe ? "border-ink bg-ink text-paper" : ""}`}
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

        <p className="label mt-12">
          EVERY DOWNLOAD PAYS THE UPLOADER PTS · SELLER KEEPS A 50% CUT OF PAID UNLOCKS
        </p>
      </div>
    </div>
  );
}