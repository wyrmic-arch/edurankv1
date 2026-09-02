"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Award, Check, Download, ThumbsUp, UploadCloud } from "lucide-react";
import { api, imgUrl, type ProfileResponse, type School } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";
import { Avatar, TierChip } from "@/components/avatar";
import { PayoutTeaser } from "@/components/payout-teaser";
import { dateTime } from "@/lib/format";

export const runtime = "edge";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    api.profile(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorPanel message={error} />;
  if (!data) return <Spinner label="PULLING PLAYER FILE…" />;

  const isMe = me?.id === data.user.id;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-6">
        <Avatar name={data.user.displayName} avatarUrl={data.user.avatarUrl} frameColor={frameColor(data.user.equippedFrameId)} size={84} />
        <div className="flex-1 min-w-[200px]">
          <div className="label">PLAYER FILE</div>
          <h1 className="font-serif text-4xl font-medium tracking-tight leading-none mt-1">{data.user.displayName}</h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <TierChip totalEarned={data.user.totalEarned} />
            <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">RANK #{data.user.rank}</span>
            {data.user.grade && <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">GR {data.user.grade}</span>}
            {isMe ? (
              <SchoolEditor currentId={data.user.schoolId ?? null} currentName={data.user.schoolName ?? null} onSaved={(n) => setData((d) => d ? { ...d, user: { ...d.user, schoolName: n } } : d)} />
            ) : (
              data.user.schoolName && <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">{data.user.schoolName}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="label">WALLET</div>
          <PTS value={data.user.balance} size="lg" />
        </div>
      </div>

      {data.user.bio && <p className="text-mute max-w-2xl text-[15px]">{data.user.bio}</p>}
      {isMe && <PayoutTeaser />}

      <div className="rule" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Stat label="Total earned" value={data.user.totalEarned.toLocaleString("en-ZA")} />
        <Stat label="Total spent" value={data.user.totalSpent.toLocaleString("en-ZA")} />
        <Stat label="Uploads live" value={String(data.stats.uploads)} />
        <Stat label="Downloads received" value={String(data.stats.downloadsReceived)} />
        <Stat label="Upvotes received" value={String(data.stats.upvotesReceived)} />
      </div>

      <div className="grid lg:grid-cols-[7fr_5fr] gap-8">
        <section className="panel">
          <header className="px-5 py-3 border-b border-cinder flex items-baseline justify-between">
            <h2 className="font-mono text-[13px] uppercase tracking-label">Points ledger</h2>
            <span className="label">FULL HISTORY · REAL ROWS</span>
          </header>
          <LedgerTable userId={isMe ? me.id : null} fallback={<LedgerHint isMe={isMe} />} />
        </section>

        <section>
          <h2 className="font-mono text-[13px] uppercase tracking-label mb-3 inline-flex items-center gap-2">
            <Award className="w-3.5 h-3.5" /> Badges
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {data.badges.map((b) => (
              <li
                key={b.id}
                className={`border p-3 ${b.awardedAt ? "border-cinder" : "border-ruleSoft opacity-50"}`}
                title={b.description}
              >
                <div className={`font-mono text-[10px] uppercase tracking-label ${b.awardedAt ? "text-ash" : "text-dim"}`}>
                  {b.name}
                </div>
                <p className="text-dim text-[11px] mt-1 leading-snug line-clamp-2">{b.description}</p>
                {!b.awardedAt && (
                  <div className="label !text-[9px] mt-2">LOCKED · {b.threshold} REQUIRED</div>
                )}
              </li>
            ))}
          </ul>
          {!isMe && me && (
            <Link href={`/profile/${me.id}`} className="btn-ghost w-full mt-4 text-[11px]">
              View my own file
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}

function LedgerHint({ isMe }: { isMe: boolean }) {
  return (
    <p className="px-5 py-8 text-mute text-[13px]">
      {isMe
        ? "Your full transaction history appears here — every earn and spend on your account."
        : "The full ledger is private. Only the player sees their complete transaction history."}
    </p>
  );
}

function LedgerTable({ userId, fallback }: { userId: string | null; fallback: React.ReactNode }) {
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    api.ledger(1).then((r) => setEntries(r.items)).catch(() => setEntries([]));
  }, [userId]);

  if (!userId || entries === null) return fallback;

  return (
    <table className="w-full text-[13px]">
      <tbody className="divide-y divide-ruleSoft">
        {entries.slice(0, 12).map((e) => (
          <tr key={e.id}>
            <td className="px-5 py-2.5 text-mute font-mono text-[11px] whitespace-nowrap">{dateTime(e.createdAt)}</td>
            <td className="py-2.5 pr-3 truncate">{e.description.replace(/^upvote:\S+$/, "Your note got an upvote")}</td>
            <td className={`py-2.5 pr-5 text-right font-mono tabular-nums whitespace-nowrap ${e.delta >= 0 ? "" : "text-mark"}`}>
              {e.delta >= 0 ? "+" : ""}
              {e.delta.toLocaleString("en-ZA")}
            </td>
          </tr>
        ))}
        {entries.length === 0 && (
          <tr><td colSpan={3} className="px-5 py-8 text-mute text-center text-[13px]">No transactions yet.</td></tr>
        )}
      </tbody>
    </table>
  );
}

interface LedgerEntry {
  id: string;
  delta: number;
  description: string;
  createdAt: string;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="font-mono text-2xl tabular-nums mt-1">{value}</div>
    </div>
  );
}

function frameColor(frameId: string | null): string | null {
  switch (frameId) {
    case "frame-volt": return "#A6FF3F";
    case "frame-gold": return "#FFC24B";
    case "frame-blood": return "#FF4D5E";
    case "frame-sky": return "#43D9FF";
    default: return null;
  }
}

function SchoolEditor({
  currentId,
  currentName,
  onSaved,
}: {
  currentId: string | null;
  currentName: string | null;
  onSaved: (name: string | null) => void;
}) {
  const { setUser, refresh } = useAuth();
  const [editing, setEditing] = useState(!currentId);
  const [schools, setSchools] = useState<School[]>([]);
  const [value, setValue] = useState<string>(currentId ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.schools().then((r) => setSchools(r.items)).catch(() => {});
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const school = schools.find((s) => s.id === value);
      const { user: u } = await api.updateMe({ schoolId: value || null });
      if (u) setUser(u);
      onSaved(school?.name ?? null);
      setMsg("Saved.");
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  // not editing: show the chip + a small edit button
  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft hover:border-ash px-2 py-0.5 inline-flex items-center gap-1.5"
        title="Change school"
      >
        {currentName ?? "NO SCHOOL"}
        <span className="text-dim">EDIT</span>
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <select
        value={value}
        onChange={(e) => { setValue(e.target.value); setMsg(null); }}
        className="px-2 py-1 text-[12px] max-w-[240px]"
        aria-label="Choose your school"
      >
        <option value="">— no school —</option>
        {schools.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button onClick={() => void save()} disabled={busy} className="btn-solid !text-[10px]" title="Save school">
        <Check className="w-3 h-3" /> {busy ? "…" : "SAVE"}
      </button>
      {!currentId && currentName === null && (
        <button onClick={() => { setEditing(false); setMsg(null); }} className="font-mono text-[10px] uppercase tracking-label text-mute hover:text-ink">CANCEL</button>
      )}
      {msg && <span className="label !text-[10px]">{msg}</span>}
    </span>
  );
}