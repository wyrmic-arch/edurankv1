"use client";

import Link from "next/link";
import { Download, ThumbsUp, User as UserIcon } from "lucide-react";
import type { Note } from "@/lib/api";
import { imgUrl } from "@/lib/api";
import { timeAgo } from "@/lib/format";

export function NoteCard({ note }: { note: Note }) {
  const art = note.coverUrl ? imgUrl(note.coverUrl) : `${imgUrl(`/img/subject/${note.subjectId}`)}`;
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group panel overflow-hidden flex flex-col hover:border-ink/30 transition-all duration-150 hover:shadow-panel"
    >
      <div className="relative h-32 overflow-hidden bg-surface-2">
        {art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={art}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-[1.04] transition-all duration-300"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
        <span
          className="absolute top-2 left-2 font-mono text-[10px] tracking-hud uppercase px-2 py-0.5 bg-void/80 border"
          style={{ color: note.subjectColor, borderColor: `${note.subjectColor}55` }}
        >
          GR {note.grade} · {note.subjectName}
        </span>
        <div className="absolute bottom-2 right-2">
          {note.isFree ? (
            <span className="font-mono text-xs text-volt tracking-wider">FREE</span>
          ) : (
            <span className="font-mono text-xs text-gold tracking-wider">{note.pricePoints} PTS</span>
          )}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-volt transition-colors">{note.title}</h3>
        <div className="mt-auto flex items-center justify-between text-dim">
          <span className="inline-flex items-center gap-1.5 text-xs min-w-0">
            <UserIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{note.uploaderName}</span>
          </span>
          <span className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-mono" title="upvotes">
              <ThumbsUp className="w-3.5 h-3.5" /> {note.upvoteCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono" title="downloads">
              <Download className="w-3.5 h-3.5" /> {note.downloadCount}
            </span>
          </span>
        </div>
        <div className="hud-label !text-[9px]">{timeAgo(note.createdAt)}</div>
      </div>
    </Link>
  );
}
