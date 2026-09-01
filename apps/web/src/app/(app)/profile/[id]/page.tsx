"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Award, Download, ThumbsUp, UploadCloud } from "lucide-react";
import { api, imgUrl, type ProfileResponse } from "@/lib/api";
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
    <div className="space-y-6">
      {/* banner */}
      <div className="relative clip-hud border border-line h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl(data.user.bannerUrl) ?? ""} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent" />
      </div>

      <div className="-mt-20 px-1 space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <Avatar name={data.user.displayName} avatarUrl={data.user.avatarUrl} frameColor={frameColor(data.user.equippedFrameId)} size={84} />
          <div className="flex-1 min-w-[200px]">
            <h1 className="font-display uppercase text-3xl leading-none">{data.user.displayName}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <TierChip totalEarned={data.user.totalEarned} />
              <span className="chip">RANK #{data.user.rank}</span>
              {data.user.grade && <span className="chip">GR {data.user.grade}</span>}
              {data.user.schoolName && <span className="chip">{data.user.schoolName}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="hud-label">WALLET</div>
            <PTS value={data.user.balance} size="lg" />
          </div>
        </div>

        {data.user.bio && <p className="text-mute max-w-2xl">{data.user.bio}</p>}

        {isMe && <PayoutTeaser />}

        {/* stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Stat label="TOTAL EARNED" value={data.user.totalEarned.toLocaleString("en-ZA")} tone="volt" />
          <Stat label="TOTAL SPENT" value={data.user.totalSpent.toLocaleString("en-ZA")} tone="gold" />
          <Stat label="UPLOADS LIVE" value={String(data.stats.uploads)} icon={<UploadCloud className="w-3 h-3" />} />
          <Stat label="DOWNLOADS RECEIVED" value={String(data.stats.downloadsReceived)} icon={<Download className="w-3 h-3" />} />
          <Stat label="UPVOTES RECEIVED" value={String(data.stats.upvotesReceived)} icon={<ThumbsUp className="w-3 h-3" />} />
        </div>

        <div className="grid lg:grid-cols-[7fr_5fr] gap-6">
          {/* ledger */}
          <section className="panel">
            <header className="px-4 py-3 border-b border-line flex items-center justify-between">
              <h2 className="font-display uppercase tracking-wider">Points ledger</h2>
              <span className="hud-label">FULL HISTORY · REAL ROWS</span>
            </header>
            <LedgerTable userId={isMe ? me.id : null} fallback={<LedgerHint isMe={isMe} />} />
          </section>

          {/* badges */}
          <section>
            <h2 className="font-display uppercase tracking-wider mb-3 inline-flex items-center gap-2">
              <Award className="w-4 h-4 text-gold" /> Badges
            </h2>
            <ul className="grid grid-cols-2 gap-2">
              {data.badges.map((b) => (
                <li
                  key={b.id}
                  className={`border clip-hud-sm p-3 ${b.awardedAt ? "border-gold/40 bg-gold/5" : "border-line bg-surface-1 opacity-45"}`}
                  title={b.description}
                >
                  <div className={`font-mono text-[10px] tracking-hud uppercase ${b.awardedAt ? "text-gold" : "text-dim"}`}>
                    {b.name}
                  </div>
                  <p className="text-dim text-xs mt-1 leading-snug line-clamp-2">{b.description}</p>
                  {!b.awardedAt && (
                    <div className="hud-label mt-2 !text-[9px]">LOCKED · {b.threshold} REQUIRED</div>
                  )}
                </li>
              ))}
            </ul>
            {!isMe && (
              <Link href={`/profile/${me?.id}`} className="btn-ghost w-full mt-4 text-xs">
                View my own file
              </Link>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function LedgerHint({ isMe }: { isMe: boolean }) {
  return (
    <p className="px-4 py-6 text-mute text-sm">
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
    <table className="w-full text-sm">
      <tbody className="divide-y divide-line/60">
        {entries.slice(0, 12).map((e) => (
          <tr key={e.id}>
            <td className="px-4 py-2.5 text-dim font-mono text-xs whitespace-nowrap">{dateTime(e.createdAt)}</td>
            <td className="py-2.5 pr-3 truncate">{e.description.replace(/^upvote:\S+$/, "Your note got an upvote")}</td>
            <td className={`py-2.5 pr-4 text-right font-mono font-semibold whitespace-nowrap ${e.delta >= 0 ? "text-volt" : "text-blood"}`}>
              {e.delta >= 0 ? "+" : ""}
              {e.delta.toLocaleString("en-ZA")}
            </td>
          </tr>
        ))}
        {entries.length === 0 && (
          <tr><td colSpan={3} className="px-4 py-6 text-mute text-center text-sm">No transactions yet.</td></tr>
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

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: "volt" | "gold"; icon?: React.ReactNode }) {
  return (
    <div className="panel p-3">
      <div className="hud-label !text-[9px] inline-flex items-center gap-1.5">{icon} {label}</div>
      <div className={`font-mono text-xl font-bold mt-1 ${tone === "gold" ? "text-gold" : tone === "volt" ? "text-volt" : "text-ink"}`}>{value}</div>
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
