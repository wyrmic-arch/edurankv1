"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, Lock, MapPin, Search, Users } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MLMap, Marker as MLMarker } from "maplibre-gl";
import { api, schoolCoverUrl, type School, type SchoolDetail } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, Spinner } from "@/components/hud";

// OpenFreeMap (https://openfreemap.org) — free forever, no API key, no request
// limits. Tiles + glyphs + sprites come from their public instance; the look is
// our own local style file at /map-style.json (edit it to restyle the map).
const STYLE_URL = "/map-style.json";
const SA_CENTER: [number, number] = [24.7, -29.0];

export default function MapPage() {
  return (
    <Suspense fallback={<Spinner label="DRAWING THE MAP…" />}>
      <MapInner />
    </Suspense>
  );
}

function MapInner() {
  const params = useSearchParams();
  const selectMode = params.get("select") === "1";
  const router = useRouter();
  const { user, setUser } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Map<string, { marker: MLMarker; lng: number; lat: number }>>(new Map());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const onSelectRef = useRef<(s: School) => void>(() => {});

  const [schools, setSchools] = useState<School[] | null>(null);
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);

  const [selected, setSelected] = useState<School | null>(null);
  const [detail, setDetail] = useState<SchoolDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const located = useMemo(() => (schools ?? []).filter((s) => s.lat != null && s.lng != null), [schools]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools ?? [];
    return (schools ?? []).filter(
      (s) => s.name.toLowerCase().includes(q) || (s.city ?? "").toLowerCase().includes(q) || s.province.toLowerCase().includes(q),
    );
  }, [schools, query]);

  const selectSchool = useCallback((s: School) => {
    setSelected(s);
    setDetail(null);
    setDetailError(null);
    setFlash(null);
    const entry = markersRef.current.get(s.id);
    if (entry && mapRef.current) {
      mapRef.current.flyTo({ center: [entry.lng, entry.lat], zoom: Math.max(mapRef.current.getZoom(), 9), duration: 700 });
    }
    api
      .school(s.id)
      .then(setDetail)
      .catch((e) => setDetailError(e instanceof Error ? e.message : "Could not load this school."));
  }, []);
  onSelectRef.current = selectSchool;

  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;
    (async () => {
      // Bundlers don't emit MapLibre's worker; point it at the copy we serve
      // from /public (maplibre-gl-worker.mjs + its maplibre-gl-shared.mjs dep).
      const { Map: MapCtor, NavigationControl, Marker, LngLatBounds, setWorkerUrl } = await import("maplibre-gl");
      setWorkerUrl("/maplibre-gl-worker.mjs");
      if (cancelled || !containerRef.current) return;

      const map = new MapCtor({
        container: containerRef.current,
        style: STYLE_URL,
        center: SA_CENTER,
        zoom: 4.6,
        attributionControl: { compact: true },
        maxBounds: [
          [12, -37],
          [40, -19],
        ],
      });
      mapRef.current = map;
      map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");

      // Keep the canvas matched to its panel as the layout settles / resizes.
      const ro = new ResizeObserver(() => map.resize());
      ro.observe(containerRef.current);
      resizeObserverRef.current = ro;

      map.on("error", (e) => console.error("Map error:", e?.error ?? e));
      map.on("load", () => {
        if (!cancelled) setReady(true);
      });

      const { items } = await api.schools().catch(() => ({ items: [] as School[] }));
      if (cancelled) return;
      setSchools(items);

      const bounds = new LngLatBounds();
      for (const s of items) {
        if (s.lat == null || s.lng == null) continue;
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", s.name);
        el.className = "edu-marker";
        el.dataset.players = String(s.playerCount);
        el.addEventListener("click", () => onSelectRef.current(s));
        const marker = new Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map);
        markers.set(s.id, { marker, lng: s.lng, lat: s.lat });
        bounds.extend([s.lng, s.lat]);
      }
      if (items.some((s) => s.lat != null && s.lng != null)) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 7, duration: 0 });
      }
    })();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    markersRef.current.forEach(({ marker }, id) => {
      const el = marker.getElement();
      if (el) el.dataset.selected = String(id === selected?.id);
    });
  }, [selected]);

  async function chooseSchool() {
    if (!selected) return;
    setBusy(true);
    setFlash(null);
    try {
      const { user: u } = await api.updateMe({ schoolId: selected.id });
      setUser(u);
      setFlash(`${selected.name} is now your school.`);
      if (selectMode) router.push(`/profile/${u.id}`);
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "Could not set your school.");
    } finally {
      setBusy(false);
    }
  }

  const isMySchool = !!user && !!selected && user.schoolId === selected.id;
  const schoolLocked = !!user?.schoolId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label inline-flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent" /> SCHOOL MAP · SOUTH AFRICA
          </div>
          <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">
            {selectMode ? "Pick your school." : "The map."}
          </h1>
        </div>
        <div className="text-right">
          <div className="label">PLOTTED</div>
          <div className="font-mono text-2xl tabular-nums">{located.length} SCHOOLS</div>
        </div>
      </div>

      {selectMode && !schoolLocked && (
        <div className="panel border-accent px-4 py-3 text-[13px] flex items-center gap-3">
          <MapPin className="w-4 h-4 text-accent shrink-0" />
          Tap a pin (or a school in the list), check it&rsquo;s yours, then hit <b className="mx-1">SET AS MY SCHOOL</b>. This locks for good.
        </div>
      )}
      {selectMode && schoolLocked && (
        <div className="panel px-4 py-3 text-[13px] flex items-center gap-3">
          <Lock className="w-4 h-4 text-mute shrink-0" />
          Your school is locked. Contact support if it needs correcting.
        </div>
      )}

      <div className="grid lg:grid-cols-[7fr_5fr] gap-6 items-start">
        <div className="relative panel overflow-hidden h-[64vh] min-h-[420px]">
          {/* NB: MapLibre forces `.maplibregl-map { position: relative }`, so use
              explicit w-full h-full here — absolute inset-0 would collapse to 0. */}
          <div ref={containerRef} className="w-full h-full" />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-night/60">
              <Spinner label="DRAWING THE MAP…" />
            </div>
          )}
        </div>

        <div className="panel flex flex-col max-h-[64vh] min-h-[420px]">
          {selected ? (
            <SchoolPanel
              selected={selected}
              detail={detail}
              error={detailError}
              busy={busy}
              flash={flash}
              isMySchool={isMySchool}
              schoolLocked={schoolLocked}
              onBack={() => { setSelected(null); setDetail(null); setFlash(null); }}
              onChoose={() => void chooseSchool()}
            />
          ) : (
            <>
              <div className="p-4 border-b border-cinder">
                <label className="relative block">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a school, city or province…"
                    className="w-full pl-9 pr-3 py-2.5 text-[13px]"
                  />
                </label>
              </div>
              <ul className="overflow-y-auto divide-y divide-ruleSoft flex-1">
                {schools === null ? (
                  <li className="p-4 text-mute text-[13px]">Loading schools…</li>
                ) : filtered.length === 0 ? (
                  <li className="p-4 text-mute text-[13px]">No schools match &ldquo;{query}&rdquo;.</li>
                ) : (
                  filtered.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => selectSchool(s)}
                        className="w-full text-left px-4 py-3 hover:bg-ink transition-colors"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium truncate">{s.name}</span>
                          <span className="font-mono text-[11px] tabular-nums text-mute shrink-0">
                            {s.playerCount} {s.playerCount === 1 ? "player" : "players"}
                          </span>
                        </div>
                        <div className="label !text-[9px] mt-1">
                          {s.city ? `${s.city.toUpperCase()} · ` : ""}
                          {s.province.toUpperCase()}
                          {s.lat == null && " · NO PIN"}
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      <p className="label text-center">
        MAPS BY OPENFREEMAP · DATA © OPENSTREETMAP CONTRIBUTORS · SCHOOL PHOTOS VIA UNSPLASH (REPRESENTATIVE)
      </p>

      <style jsx global>{`
        .edu-marker {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #e4e4e4;
          border: 2px solid #0a0a0a;
          box-shadow: 0 0 0 1px #2a2a2a;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .edu-marker:hover,
        .edu-marker[data-selected="true"] {
          transform: scale(1.4);
          background: #f0532d;
        }
        .edu-marker[data-players="0"] {
          background: #6b6f75;
        }
        .edu-marker[data-players="0"][data-selected="true"] {
          background: #f0532d;
        }
      `}</style>
    </div>
  );
}

function SchoolPanel({
  selected,
  detail,
  error,
  busy,
  flash,
  isMySchool,
  schoolLocked,
  onBack,
  onChoose,
}: {
  selected: School;
  detail: SchoolDetail | null;
  error: string | null;
  busy: boolean;
  flash: string | null;
  isMySchool: boolean;
  schoolLocked: boolean;
  onBack: () => void;
  onChoose: () => void;
}) {
  const s = detail?.school ?? selected;
  const stats = detail?.stats;
  const embed =
    s.lat != null && s.lng != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${s.lng - 0.012}%2C${s.lat - 0.008}%2C${s.lng + 0.012}%2C${s.lat + 0.008}&layer=mapnik&marker=${s.lat}%2C${s.lng}`
      : null;

  return (
    <div className="overflow-y-auto flex-1">
      <div className="sticky top-0 z-10 bg-oil border-b border-cinder px-3 py-2 flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost !text-[10px] !px-2 !py-1">
          <ArrowLeft className="w-3.5 h-3.5" /> ALL SCHOOLS
        </button>
        <Link
          href={`/leaderboard?scope=school&schoolId=${encodeURIComponent(s.id)}`}
          className="font-mono text-[10px] uppercase tracking-label text-ghost hover:text-ash no-underline inline-flex items-center gap-1"
        >
          SCHOOL BOARD <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-px bg-cinder">
        {[undefined, "2", "3"].map((v) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={v ?? "1"}
            src={schoolCoverUrl(s.id, v)}
            alt={s.name}
            loading="lazy"
            className="w-full h-28 object-cover bg-smoke"
          />
        ))}
      </div>

      <div className="p-5 space-y-5">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight leading-tight">{s.name}</h2>
          <div className="label !text-[9px] mt-1.5">
            {s.city ? `${s.city.toUpperCase()} · ` : ""}
            {s.province.toUpperCase()}
          </div>
        </div>

        {error ? (
          <p className="text-mute text-[13px] border border-cinder px-3 py-2">{error}</p>
        ) : !detail ? (
          <Spinner label="LOADING SCHOOL…" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="PLAYERS" value={stats!.playerCount.toLocaleString("en-ZA")} />
              <Stat label="NOTES" value={stats!.notesUploaded.toLocaleString("en-ZA")} />
              <Stat label="SCHOOL PTS" value={stats!.totalPoints.toLocaleString("en-ZA")} />
            </div>

            <p className="text-mute text-[13px] leading-relaxed">
              {s.name} is a {s.province} school{s.city ? ` in ${s.city}` : ""}.{" "}
              {stats!.playerCount > 0
                ? `${stats!.playerCount} ${stats!.playerCount === 1 ? "player reps" : "players rep"} it on EduRank, with ${stats!.notesUploaded} approved ${stats!.notesUploaded === 1 ? "note" : "notes"} shared.`
                : "No players have repped it yet — be the first."}
            </p>

            {embed && (
              <div className="border border-cinder">
                <div className="label !text-[9px] px-3 py-1.5 border-b border-cinder">LOCATION · OPENSTREETMAP</div>
                <iframe
                  title={`Map of ${s.name}`}
                  src={embed}
                  className="w-full h-44 block"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            {detail.topPlayers.length > 0 && (
              <div>
                <div className="label !text-[9px] mb-2 inline-flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> TOP PLAYERS
                </div>
                <ol className="divide-y divide-ruleSoft border-y border-cinder">
                  {detail.topPlayers.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 py-2">
                      <span className="font-mono text-[11px] text-mute w-5">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 min-w-0 truncate font-medium text-[13px]">{p.displayName}</span>
                      {p.grade && <span className="label !text-[9px]">GR {p.grade}</span>}
                      <PTS value={p.points} size="sm" />
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {isMySchool ? (
              <div className="btn !cursor-default border-accent text-accent">
                <Check className="w-4 h-4" /> THIS IS YOUR SCHOOL
              </div>
            ) : schoolLocked ? (
              <div className="hairline border-cinder px-3 py-2 text-[12px] text-mute">
                Your school is locked. Contact support if it needs correcting.
              </div>
            ) : (
              <button onClick={onChoose} disabled={busy} className="btn-mark w-full">
                {busy ? "SETTING…" : "SET AS MY SCHOOL"}
              </button>
            )}
            {flash && <p className="text-[12px] text-accent">{flash}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-cinder px-3 py-2">
      <div className="label !text-[9px]">{label}</div>
      <div className="font-mono text-lg tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
