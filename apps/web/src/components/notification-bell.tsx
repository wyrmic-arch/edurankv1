"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/store";

/** Navbar bell: unread badge, refreshed on a timer and when the tab refocuses. */
export function NotificationBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let live = true;
    const tick = () => {
      api
        .notificationsUnread()
        .then((r) => live && setUnread(r.unread))
        .catch(() => {});
    };
    tick();
    const id = setInterval(tick, 60_000);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", tick);
    return () => {
      live = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", tick);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center text-ghost hover:text-ash no-underline"
      title="Notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
    >
      <Bell className="w-4 h-4" />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 bg-accent text-night font-mono text-[9px] leading-[15px] text-center rounded-full">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
