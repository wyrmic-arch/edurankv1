"use client";

import { useRef, useState } from "react";
import { Check, Crop, RotateCcw, Sparkles, Trash2, Upload } from "lucide-react";
import { makePhotoEdit, type PhotoEdit } from "@/lib/photo-pdf";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function PhotoUploader({
  photos,
  onChange,
  onSelect,
  disabled,
}: {
  photos: PhotoEdit[];
  onChange: (photos: PhotoEdit[]) => void;
  /** Called when photos are added, so the parent can clear a single-file pick. */
  onSelect?: () => void;
  disabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [cropping, setCropping] = useState<string | null>(null);
  const [draft, setDraft] = useState<Rect | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const added: PhotoEdit[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        added.push(await makePhotoEdit(file));
      } catch {
        setError(`Couldn't read "${file.name}". Try a JPG/PNG, or screenshot it first.`);
      }
    }
    if (added.length) {
      onChange([...photos, ...added]);
      onSelect?.();
    }
  }

  function update(id: string, patch: Partial<PhotoEdit>) {
    onChange(photos.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function remove(id: string) {
    setCropping((c) => (c === id ? null : c));
    onChange(photos.filter((p) => p.id !== id));
  }

  function onDown(e: React.PointerEvent<HTMLDivElement>, photo: PhotoEdit) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    dragRef.current = { x, y };
    setDraft({ x, y, w: 0, h: 0 });
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    const s = dragRef.current;
    setDraft({ x: Math.min(s.x, x), y: Math.min(s.y, y), w: Math.abs(x - s.x), h: Math.abs(y - s.y) });
  }

  function onUp(photo: PhotoEdit) {
    const d = draft;
    dragRef.current = null;
    setDraft(null);
    if (d && d.w > 0.04 && d.h > 0.04) update(photo.id, { crop: d });
    setCropping(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className={`btn-solid ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
          <Upload className="w-3.5 h-3.5" /> ADD PHOTOS
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              void addFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <span className="label !text-[9px]">
          Turn phone photos into one clean PDF · enhance, straighten, crop
        </span>
      </div>

      {error && <p className="text-mark text-[12px]">{error}</p>}

      {photos.length > 0 && (
        <ul className="space-y-3">
          {photos.map((photo, index) => {
            const isCropping = cropping === photo.id;
            const shown = isCropping && draft ? draft : photo.crop;
            return (
              <li key={photo.id} className="panel p-3">
                <div className="flex gap-3">
                  <div
                    className={`relative w-28 shrink-0 overflow-hidden bg-smoke ${isCropping ? "cursor-crosshair" : ""}`}
                    style={{ aspectRatio: `${photo.naturalW} / ${photo.naturalH}` }}
                    onPointerDown={isCropping ? (e) => onDown(e, photo) : undefined}
                    onPointerMove={isCropping ? onMove : undefined}
                    onPointerUp={isCropping ? () => onUp(photo) : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.name}
                      draggable={false}
                      className="w-full h-full object-cover select-none"
                      style={{
                        filter: photo.enhance ? "grayscale(1) contrast(1.16) brightness(1.04)" : undefined,
                        transform: !isCropping && photo.rotate ? `rotate(${photo.rotate}deg)` : undefined,
                      }}
                    />
                    {shown && (shown.w > 0 || shown.h > 0) && (
                      <div
                        className="pointer-events-none absolute border border-accent"
                        style={{
                          left: `${shown.x * 100}%`,
                          top: `${shown.y * 100}%`,
                          width: `${shown.w * 100}%`,
                          height: `${shown.h * 100}%`,
                          boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                        }}
                      />
                    )}
                    <span className="absolute top-1 left-1 bg-night/80 text-[9px] font-mono px-1.5 py-0.5">{index + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="text-[12px] truncate">{photo.name || `Photo ${index + 1}`}</div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => update(photo.id, { enhance: !photo.enhance })}
                        className={`font-mono text-[10px] uppercase tracking-label px-2 py-1 border inline-flex items-center gap-1.5 ${
                          photo.enhance ? "border-accent text-accent" : "border-cinder text-ghost hover:border-ash"
                        }`}
                      >
                        <Sparkles className="w-3 h-3" /> {photo.enhance ? "ENHANCED" : "ENHANCE"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCropping(isCropping ? null : photo.id)}
                        className={`font-mono text-[10px] uppercase tracking-label px-2 py-1 border inline-flex items-center gap-1.5 ${
                          isCropping ? "border-ash text-ash" : "border-cinder text-ghost hover:border-ash"
                        }`}
                      >
                        <Crop className="w-3 h-3" /> {isCropping ? "DRAG TO CROP" : "CROP"}
                      </button>
                      {photo.crop && !isCropping && (
                        <button
                          type="button"
                          onClick={() => update(photo.id, { crop: null })}
                          className="font-mono text-[10px] uppercase tracking-label text-mute hover:text-ash inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> RESET
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(photo.id)}
                        className="font-mono text-[10px] uppercase tracking-label text-mute hover:text-mark inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> REMOVE
                      </button>
                    </div>

                    <label className="flex items-center gap-3 text-[11px] text-mute">
                      <span className="label !text-[9px] shrink-0">STRAIGHTEN</span>
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={0.5}
                        value={photo.rotate}
                        onChange={(e) => update(photo.id, { rotate: Number(e.target.value) })}
                        className="flex-1 accent-mark"
                      />
                      <span className="font-mono text-[10px] w-8 text-right">{photo.rotate}°</span>
                    </label>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {photos.length > 0 && (
        <p className="text-[12px] text-accent inline-flex items-center gap-2">
          <Check className="w-3.5 h-3.5" /> {photos.length} photo{photos.length === 1 ? "" : "s"} ready — they&rsquo;ll
          become one PDF on submit.
        </p>
      )}
    </div>
  );
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
