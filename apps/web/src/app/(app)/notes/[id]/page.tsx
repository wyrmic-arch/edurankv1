"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, ThumbsUp, User } from "lucide-react";
import { api, imgUrl, type Note } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";
import { fileSize, timeAgo } from "@/lib/format";

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
      setFlash(res.pricePaid > 0 ? `Unlocked for ${res.pricePaid} PTS. It's yours — re-download any time.` : "Claimed for FREE. It's yours.");
      load();
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  async function upvote() {
    if (!note) return;
    // Optimistic update — flip the UI instantly, roll back on failure.
    const wasUpvoted = note.upvotedByMe;
    const previousCount = note.upvoteCount;
    setNote({
      ...note,
      upvotedByMe: !wasUpvoted,
      upvoteCount: wasUpvoted ? previousCount - 1 : previousCount + 1,
    });
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
    <div className="grid lg:grid-cols-[5fr_7fr] gap-6 items-start">
      {/* left: art + file plate */}
      <div className="space-y-3 lg:sticky lg:top-20">
        <div className="relative clip-hud border border-line overflow-hidden aspect-video bg-surface-2">
          {art && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" loading="lazy" />
          )}
          <span
            className="absolute top-3 left-3 font-mono text-[10px] tracking-hud uppercase px-2 py-0.5 bg-void/80 border"
            style={{ color: note.subjectColor, borderColor: `${note.subjectColor}55` }}
          >
            GR {note.grade} · {note.subjectName}
          </span>
        </div>

        <div className="panel p-4 flex items-center justify-between">
          <div>
            <div className="hud-label">FILE</div>
            <div className="font-mono text-xs text-mute mt-0.5 truncate max-w-[220px]">{note.fileName}</div>
            <div className="font-mono text-[10px] text-dim mt-0.5">
              {fileSize(note.fileSize ?? 0)} · {timeAgo(note.createdAt)}
            </div>
          </div>
          {canDownload ? (
            <a href={api.fileUrl(note.id)} target="_blank" rel="noreferrer" className="btn-volt !py-2 text-xs">
              OPEN FILE <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button onClick={unlock} disabled={busy} className="btn-gold !py-2 text-xs whitespace-nowrap">
              {busy ? "PROCESSING…" : note.isFree ? "CLAIM — FREE" : `UNLOCK · ${note.pricePoints} PTS`}
            </button>
          )}
        </div>

        {flash && (
          <div className="border border-volt/40 bg-volt/5 clip-hud px-4 py-2.5 text-sm">{flash}</div>
        )}
      </div>

      {/* right: details */}
      <div>
        {!note.isFree && !canDownload && (
          <div className="mb-4 border border-gold/40 bg-gold/5 clip-hud px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-gold font-medium">Premium drop. One payment, lifetime access to this pack.</p>
            <PTS value={note.pricePoints} tone="gold" size="lg" />
          </div>
        )}

        <h1 className="font-display uppercase text-3xl md:text-4xl leading-tight">{note.title}</h1>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Link href={`/profile/${note.uploaderId}`} className="chip hover:border-ink/40 transition-colors">
            <User className="w-3 h-3" /> {note.uploaderName}
          </Link>
          <Link href={`/district/${note.subjectId}`} className="chip" style={{ color: note.subjectColor }}>
            {note.subjectName.toUpperCase()}
          </Link>
          <span className="chip">GR {note.grade}</span>
          {note.topic && <span className="chip">{note.topic}</span>}
        </div>

        <p className="text-mute leading-relaxed mt-5 whitespace-pre-wrap">{note.description}</p>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={upvote}
            disabled={note.ownedByMe}
            className={`btn ${note.upvotedByMe ? "bg-volt/15 border-volt text-volt shadow-glow-volt" : "bg-transparent border-line text-ink hover:border-ink/40"} !px-4`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="font-mono">{note.upvoteCount}</span>
          </button>
          <span className="inline-flex items-center gap-1.5 chip">
            <Download className="w-3.5 h-3.5" /> {note.downloadCount} downloads
          </span>
          {user?.role === "admin" && (
            <span className="chip border-blood/50 text-blood">STATUS: {note.status.toUpperCase()}</span>
          )}
        </div>

        <p className="hud-label mt-8 !text-[9px]">
          EVERY DOWNLOAD PAYS THE UPLOADER PTS · SELLER KEEPS A 50% CUT OF PAID UNLOCKS
        </p>
      </div>
    </div>
  );
}
