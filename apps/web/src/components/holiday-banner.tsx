"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { seasonInfo } from "@edurank/shared";

function niceDate(key: string): string {
  const d = new Date(`${key}T00:00:00+02:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long" });
}

/** Shown across the app during the December off-season. */
export function HolidayBanner() {
  const s = seasonInfo();
  if (!s.active) return null;

  return (
    <div className="mb-6 panel border-accent p-4 flex flex-wrap items-center gap-3">
      <CalendarClock className="w-4 h-4 text-accent shrink-0" />
      <div className="flex-1 min-w-[220px]">
        <div className="font-medium text-ash">Holiday mode — Season {s.season} is closed.</div>
        <p className="text-ghost text-[13px] mt-0.5">
          Challenges, streaks and the boards are paused for the December holidays and reopen on{" "}
          {niceDate(s.reopensOn)}. Free notes stay open all holiday.
        </p>
      </div>
      <Link href="/study" className="btn-ghost !text-[10px]">
        BROWSE FREE NOTES
      </Link>
    </div>
  );
}
