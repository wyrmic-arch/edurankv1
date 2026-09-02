"use client";

import { Download, ThumbsUp, User as UserIcon } from "lucide-react";
import type { Note } from "@/lib/api";
import { imgUrl } from "@/lib/api";
import { timeAgo } from "@/lib/format";

export function NoteCard({ note }: { note: Note }) {
  const art = imgUrl(`/img/subject/${note.subjectId}`);
  return (
    <a
      href={`/notes/${note.id}`}
      className="group panel overflow-hidden flex flex-col no-underline hover:bg-ink hover:text-paper transition-colors"
    >
      <div className="relative h-32 overflow-hidden bg-ruleSoft">
        {art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={art}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-90 transition-opacity"
          />
        )}
        <div className="absolute inset-0 bg-night/30" />
        <span
          className="absolute top-2 left-2 font-mono text-[10px] uppercase tracking-label px-2 py-0.5 border border-cinder bg-oil text-ash"
        >
          GR {note.grade} · {note.subjectId.toUpperCase()}
        </span>
        <div className="absolute bottom-2 right-2">
          {note.isFree ? (
            <span className="font-mono text-[10px] uppercase tracking-label">FREE</span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-label font-bold">
              {note.pricePoints} PTS
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-medium leading-snug line-clamp-2">{note.title}</h3>
        <div className="mt-auto flex items-center justify-between text-[11px]">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <UserIcon className="w-3 h-3 shrink-0" />
            <span className="truncate">{note.uploaderName}</span>
          </span>
          <span className="flex items-center gap-3 shrink-0 font-mono">
            <span className="inline-flex items-center gap-1" title="upvotes">
              <ThumbsUp className="w-3 h-3" /> {note.upvoteCount}
            </span>
            <span className="inline-flex items-center gap-1" title="downloads">
              <Download className="w-3 h-3" /> {note.downloadCount}
            </span>
          </span>
        </div>
        <div className="label !text-[9px]">{timeAgo(note.createdAt)}</div>
      </div>
    </a>
  );
}