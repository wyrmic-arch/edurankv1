"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Award, Bell, Download, Lock, Share2, ThumbsUp, UploadCloud, UserPlus } from "lucide-react";
import { GRADES, seasonInfo } from "@edurank/shared";
import { api, imgUrl, type ProfileResponse } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";
import { Avatar, TierChip } from "@/components/avatar";
import { PayoutTeaser } from "@/components/payout-teaser";
import { dateTime, tierFor } from "@/lib/format";
import { referralMessage, shareRankCard, siteOrigin, whatsappUrl } from "@/lib/share";

export const runtime = "edge";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    api.profile(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorPanel message={error} />;
  if (!data) return <Spinner label="PULLING PLAYER FILE…" />;

  const isMe = me?.id === data.user.id;

  async function shareRank() {
    if (!data || sharing) return;
    setSharing(true);
    setShareMsg(null);
    try {
      const result = await shareRankCard({
        displayName: data.user.displayName,
        rank: data.user.rank,
        points: data.user.totalEarned,
        schoolName: data.user.schoolName,
        tierLabel: tierFor(data.user.totalEarned).label,
        season: seasonInfo().season,
      });
      if (result === "downloaded") {
        setShareMsg("Rank card downloaded — post it on WhatsApp or Instagram.");
        setTimeout(() => setShareMsg(null), 4000);
      }
    } catch {
      setShareMsg("Couldn't build the card — try again.");
      setTimeout(() => setShareMsg(null), 3000);
    } finally {
      setSharing(false);
    }
  }

  async function inviteFriends() {
    if (!data) return;
    const code = data.user.referralCode;
    const link = `${siteOrigin()}/register?ref=${code}`;
    const text = `${referralMessage(data.user.displayName, code)} ${link}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Join EduRank", text });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    window.open(whatsappUrl(text), "_blank", "noopener");
  }

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
            {isMe ? (
              <>
                <GradeEditor currentGrade={data.user.grade} />
                <SchoolEditor currentName={data.user.schoolName ?? null} locked={data.user.schoolId != null} />
              </>
            ) : (
              <>
                {data.user.grade && <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">GR {data.user.grade}</span>}
                {data.user.schoolName && <span className="font-mono text-[11px] uppercase tracking-label border border-ruleSoft px-2 py-0.5">{data.user.schoolName}</span>}
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="label">WALLET</div>
          <PTS value={data.user.balance} size="lg" />
        </div>
      </div>

      {isMe && (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => void shareRank()} disabled={sharing} className="btn-mark !text-[10px]">
            <Share2 className="w-3 h-3" /> {sharing ? "BUILDING…" : "SHARE MY RANK CARD"}
          </button>
          <button onClick={() => void inviteFriends()} className="btn-ghost !text-[10px]">
            <UserPlus className="w-3 h-3" /> INVITE FRIENDS (+PTS)
          </button>
          {shareMsg && <span className="text-[12px] text-accent">{shareMsg}</span>}
        </div>
      )}

      {data.user.bio && <p className="text-mute max-w-2xl text-[15px]">{data.user.bio}</p>}
      {isMe && <PayoutTeaser />}
      {isMe && <NotificationPrefs />}

      <div className="rule" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Stat label="Total earned" value={data.user.totalEarned.toLocaleString("en-ZA")} />
        <Stat label="Total spent" value={data.user.totalSpent.toLocaleString("en-ZA")} />
        <Stat label="Uploads live" value={String(data.stats.uploads)} />
        <Stat label="Downloads received" value={String(data.stats.downloadsReceived)} />
        <Stat label="Upvotes received" value={String(data.stats.upvotesReceived)} />
      </div>

      <div className="grid lg:grid-cols-[7fr_5fr] gap-8">
        <section className="panel min-w-0">
          <header className="px-5 py-3 border-b border-cinder flex items-baseline justify-between">
            <h2 className="font-mono text-[13px] uppercase tracking-label">Points ledger</h2>
            <span className="label">FULL HISTORY · REAL ROWS</span>
          </header>
          <LedgerTable userId={isMe ? me.id : null} fallback={<LedgerHint isMe={isMe} />} />
        </section>

        <section className="min-w-0">
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
    <div className="overflow-x-auto">
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
    </div>
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

function NotificationPrefs() {
  const [email, setEmail] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.notificationPrefs().then((r) => setEmail(r.email)).catch(() => setEmail(null));
  }, []);
  if (email === null) return null;
  async function toggle() {
    setBusy(true);
    try {
      const r = await api.setNotificationPrefs(!email);
      setEmail(r.email);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={() => void toggle()}
      disabled={busy}
      className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-label border border-ruleSoft px-3 py-1.5 text-ghost hover:border-ash hover:text-ash"
      title="Daily email summary of your notifications"
    >
      <Bell className="w-3 h-3" /> Daily email digest:{" "}
      <span className={email ? "text-accent" : "text-mute"}>{email ? "ON" : "OFF"}</span>
    </button>
  );
}

function GradeEditor({ currentGrade }: { currentGrade: number | null }) {
  const { setUser } = useAuth();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (currentGrade != null) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-label border border-cinder text-ash px-2 py-0.5 inline-flex items-center gap-1.5" title="Locked for the school year">
        <Lock className="w-3 h-3" /> GR {currentGrade}
      </span>
    );
  }

  async function lockGrade() {
    if (!value) return;
    setBusy(true);
    setMsg(null);
    try {
      const { user } = await api.updateMe({ grade: Number(value) });
      setUser(user);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not set your grade.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="font-mono text-[11px] uppercase tracking-label border border-accent text-accent px-2 py-0.5">
          SET YOUR GRADE
        </button>
      ) : (
        <>
          <span className="font-mono text-[10px] uppercase tracking-label text-mute">Locks for the year:</span>
          <select value={value} onChange={(e) => setValue(e.target.value)} className="px-2 py-1 text-[12px]">
            <option value="">GRADE…</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
          <button onClick={() => void lockGrade()} disabled={busy || !value} className="btn-mark !text-[10px] !px-2 !py-1">
            {busy ? "…" : "LOCK IT IN"}
          </button>
          <button onClick={() => setConfirming(false)} className="font-mono text-[10px] uppercase tracking-label text-mute hover:text-ash">CANCEL</button>
        </>
      )}
      {msg && <span className="text-mark text-[11px]">{msg}</span>}
    </span>
  );
}

function SchoolEditor({ currentName, locked }: { currentName: string | null; locked: boolean }) {
  if (locked) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-label border border-cinder text-ash px-2 py-0.5 inline-flex items-center gap-1.5" title="Your school is locked. Contact support to change it.">
        <Lock className="w-3 h-3" /> {currentName ?? "SCHOOL"}
      </span>
    );
  }
  // Choosing a school happens on the map — this just deep-links there.
  return (
    <Link
      href="/map?select=1"
      className="font-mono text-[11px] uppercase tracking-label border border-accent text-accent hover:bg-accent hover:text-night px-2 py-0.5 inline-flex items-center gap-1.5 no-underline"
      title="Choose your school on the map (locks once set)"
    >
      CHOOSE SCHOOL ON MAP
    </Link>
  );
}