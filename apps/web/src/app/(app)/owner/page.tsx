"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, ShieldAlert, Ticket, Users, FileText, Coins, Activity } from "lucide-react";
import { api, type OwnerOverview, type OwnerLive } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";
import { timeAgo } from "@/lib/format";

export default function OwnerPage() {
  const { user } = useAuth();
  const [data, setData] = useState<OwnerOverview | null>(null);
  const [live, setLive] = useState<OwnerLive | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.ownerOverview().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    if (user?.role !== "owner") return;
    let alive = true;
    const tick = () =>
      api.ownerLive().then((v) => alive && setLive(v)).catch(() => {});
    tick();
    const timer = window.setInterval(tick, 15_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [user]);

  if (!user) return <Spinner />;
  if (user.role !== "owner") {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <ShieldAlert className="w-10 h-10 mx-auto text-mark mb-4" />
        <h1 className="font-serif text-3xl font-medium">Owner only.</h1>
      </div>
    );
  }
  if (error) return <ErrorPanel message={error} onRetry={() => location.reload()} />;
  if (!data) return <Spinner label="OPENING THE CONTROL ROOM…" />;

  const s = data.stats;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label inline-flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-accent" /> OWNER · CONTROL ROOM
          </div>
          <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">Everything.</h1>
        </div>
        <div className="label">SIGNED IN AS {user.displayName.toUpperCase()}</div>
      </div>

      <section>
        <SectionLabel icon={<Activity className="w-3.5 h-3.5" />} text="LIVE" />
        <div className="panel p-4 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping-slow" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
            </span>
            <div>
              <div className="font-mono text-4xl tabular-nums leading-none">
                {live ? live.active.toLocaleString("en-ZA") : "—"}
              </div>
              <div className="label !text-[9px] mt-1">ON THE SITE NOW</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <LiveStat label="SIGNED IN" value={live?.signedIn} />
            <LiveStat label="GUESTS" value={live?.guests} />
          </div>

          <div className="min-w-[200px] flex-1">
            <div className="label !text-[9px] mb-1.5">HOT PAGES</div>
            <ul className="space-y-1">
              {(live?.topPaths ?? []).slice(0, 4).map((p) => (
                <li key={p.path} className="flex items-center gap-3 text-[12px]">
                  <span className="flex-1 min-w-0 truncate font-mono text-mute">{p.path}</span>
                  <span className="font-mono tabular-nums">{p.count}</span>
                </li>
              ))}
              {live && live.topPaths.length === 0 && (
                <li className="text-[12px] text-mute">No one on the site yet.</li>
              )}
            </ul>
          </div>

          <div className="label !text-[9px] self-start">
            {live ? `UPDATED ${timeAgo(live.updatedAt)}` : "LOADING…"}
          </div>
        </div>
      </section>

      {s.principalInvites === 0 && (
        <div className="panel p-4 border-accent flex flex-wrap items-center gap-3">
          <Ticket className="w-4 h-4 text-accent shrink-0" />
          <p className="flex-1 min-w-[240px] text-[13px]">
            No principals have been invited yet. Start the staff chain by creating the first principal invite.
          </p>
          <Link href="/admin" className="btn-mark !text-[10px]">CREATE PRINCIPAL INVITE</Link>
        </div>
      )}

      <section>
        <SectionLabel icon={<Users className="w-3.5 h-3.5" />} text="PEOPLE" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="STUDENTS" value={s.students} />
          <Stat label="TEACHERS" value={s.teachers} />
          <Stat label="PRINCIPALS" value={s.principals} />
          <Stat label="ADMINS" value={s.admins} />
          <Stat label="OWNERS" value={s.owners} />
        </div>
      </section>

      <section>
        <SectionLabel icon={<FileText className="w-3.5 h-3.5" />} text="CONTENT" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="NOTES" value={s.notesTotal} />
          <Stat label="APPROVED" value={s.notesApproved} />
          <Stat label="PENDING" value={s.notesPending} />
          <Stat label="OFFICIAL" value={s.notesOfficial} />
          <Stat label="OPEN REPORTS" value={s.reportsOpen} />
        </div>
      </section>

      <section>
        <SectionLabel icon={<Coins className="w-3.5 h-3.5" />} text="ECONOMY" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="PTS ISSUED" value={s.pointsIssued} />
          <Stat label="PTS SPENT" value={s.pointsSpent} />
          <Stat label="OUTSTANDING" value={s.pointsOutstanding} />
          <Stat label="UNLOCKS" value={s.unlocks} />
        </div>
        <p className="label mt-2">
          OUTSTANDING = <PTS value={s.pointsOutstanding} size="sm" /> HELD BY USERS · ISSUED = {s.pointsIssued.toLocaleString("en-ZA")}
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionLabel icon={<Users className="w-3.5 h-3.5" />} text="RECENT SIGNUPS" />
          <ul className="panel divide-y divide-ruleSoft">
            {data.recentUsers.length === 0 && <li className="p-3 text-mute text-[13px]">No users yet.</li>}
            {data.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                <Link href={`/profile/${u.id}`} className="flex-1 min-w-0 truncate text-[13px] no-underline hover:text-accent">
                  {u.displayName}
                </Link>
                <span className="font-mono text-[10px] uppercase tracking-label text-mute">{u.role}</span>
                <span className="label !text-[9px] w-20 text-right">{timeAgo(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionLabel icon={<FileText className="w-3.5 h-3.5" />} text="RECENT NOTES" />
          <ul className="panel divide-y divide-ruleSoft">
            {data.recentNotes.length === 0 && <li className="p-3 text-mute text-[13px]">No notes yet.</li>}
            {data.recentNotes.map((n) => (
              <li key={n.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 min-w-0 truncate text-[13px]">{n.title}</span>
                {n.official && <span className="font-mono text-[9px] uppercase tracking-label text-accent">OFFICIAL</span>}
                <span className="font-mono text-[10px] uppercase tracking-label text-mute">{n.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section>
        <SectionLabel icon={<ShieldAlert className="w-3.5 h-3.5" />} text="CONTROLS" />
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost !text-[11px]">MODERATION &amp; REPORTS</Link>
          <Link href="/admin" className="btn-ghost !text-[11px]">USERS, INVITES &amp; PROMOTIONS</Link>
          <Link href="/school" className="btn-ghost !text-[11px]">SCHOOL DESKS</Link>
          <Link href="/study" className="btn-ghost !text-[11px]">FREE OFFICIAL NOTES</Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="hairline px-4 py-3">
      <div className="label !text-[9px]">{label}</div>
      <div className="font-mono text-2xl tabular-nums mt-1">{value.toLocaleString("en-ZA")}</div>
    </div>
  );
}

function LiveStat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <div className="font-mono text-xl tabular-nums leading-none">
        {value === undefined ? "—" : value.toLocaleString("en-ZA")}
      </div>
      <div className="label !text-[9px] mt-1">{label}</div>
    </div>
  );
}

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="label inline-flex items-center gap-2 mb-3">
      {icon} {text}
    </div>
  );
}
