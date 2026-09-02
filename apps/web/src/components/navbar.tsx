"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import { useAuth } from "@/lib/store";
import { Avatar } from "./avatar";
import { PTS } from "./hud";

const LINKS = [
  { href: "/map",         label: "MAP" },
  { href: "/leaderboard", label: "RANKS" },
  { href: "/challenges",  label: "DAILY" },
  { href: "/shop",        label: "SHOP" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-ink">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-6">
        <Link href="/map" className="flex items-baseline gap-2 shrink-0 no-underline">
          <span className="font-mono text-[15px] tracking-tight font-bold">EDURANK</span>
        </Link>

        <nav className="flex items-center gap-5 flex-1">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`font-mono text-[11px] uppercase tracking-label no-underline ${
                  active ? "text-ink underline" : "text-mute hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/upload"
            className={`font-mono text-[11px] uppercase tracking-label no-underline ${
              pathname.startsWith("/upload") ? "text-mark underline" : "text-mute hover:text-ink"
            }`}
          >
            UPLOAD
          </Link>
        </nav>

        {user ? (
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href={`/profile/${user.id}`}
              className="hidden sm:flex items-baseline gap-2 no-underline hover:text-mark"
              title={`Wallet · ${user.streakCount}-day streak`}
            >
              <PTS value={user.balance} size="sm" />
              <span className="font-mono text-[10px] text-dim">
                {user.streakCount}d
              </span>
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 hover:text-mark"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar name={user.displayName} avatarUrl={user.avatarUrl} frameColor={frameColor(user)} size={26} />
                <span className="hidden md:inline text-[13px] max-w-[120px] truncate">{user.displayName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-dim" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 panel p-1.5 z-50">
                  <MenuLink href={`/profile/${user.id}`} label="Profile" />
                  <MenuLink href="/shop" label="Shop" />
                  <MenuLink href="/map" label="City Map" />
                  <MenuLink href="/leaderboard" label="Leaderboards" />
                  <MenuLink href="/upload" label="Upload a note" />
                  {user.role === "admin" && (
                    <MenuLink href="/admin" label="Moderation" />
                  )}
                  <button
                    onClick={() => void logout()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-mark hover:bg-ink hover:text-paper transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="font-mono text-[11px] uppercase tracking-label text-mute hover:text-ink no-underline">
              Log in
            </Link>
            <Link href="/register" className="btn-solid">
              Enlist
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function frameColor(user: { equippedFrameId: string | null }): string | null {
  switch (user.equippedFrameId) {
    case "frame-volt":  return "#A6FF3F";
    case "frame-gold":  return "#FFC24B";
    case "frame-blood": return "#FF4D5E";
    case "frame-sky":   return "#43D9FF";
    default: return null;
  }
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 text-[13px] hover:bg-ink hover:text-paper transition-colors no-underline"
    >
      {label}
    </Link>
  );
}