"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import type { NotificationDTO } from "@edurank/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/hud";
import { timeAgo } from "@/lib/format";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationDTO[] | null>(null);

  useEffect(() => {
    api
      .notifications()
      .then((r) => {
        setItems(r.items);
        // Clear the badge once the user has seen the list.
        void api.markNotificationsRead();
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="label inline-flex items-center gap-2"><Bell className="w-3.5 h-3.5 text-accent" /> INBOX</div>
        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">Notifications.</h1>
      </div>

      <div className="rule" />

      {items === null ? (
        <Spinner label="LOADING…" />
      ) : items.length === 0 ? (
        <p className="text-mute text-[13px] py-10 text-center border border-dashed border-ruleSoft">
          Nothing yet. Approvals, unlocks and teacher checks land here.
        </p>
      ) : (
        <ul className="panel divide-y divide-ruleSoft">
          {items.map((n) => {
            const body = (
              <div className="flex items-start gap-3 px-5 py-4">
                {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className={`text-[14px] ${n.read ? "text-ash" : "font-medium text-ash"}`}>{n.title}</div>
                  {n.body && <p className="text-mute text-[13px] mt-0.5">{n.body}</p>}
                  <div className="label !text-[9px] mt-1.5">{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="block hover:bg-ink no-underline">{body}</Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
