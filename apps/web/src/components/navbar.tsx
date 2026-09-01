"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Flame, LogOut, Map as MapIcon, Shield, ShoppingBag, Trophy, UploadCloud, User } from "lucide-react";
import { useAuth } from "@/lib/store";
import { Avatar } from "./avatar";
import { PTS } from "./hud";

const LINKS = [
  { href: "/map", label: "MAP" },
  { href: "/leaderboard", label: "RANKS" },
  { href: "/challenges", label: "DAILY" },
  { href: "/shop", label: "SHOP" },
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
    <header className="sticky top-0 z-50 border-b border-line bg-void/85 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/map" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-xl tracking-wider">
            EDU<span className="text-volt">RANK</span>
          </span>
          <span className="hud-label !text-[9px] hidden lg:inline mt-1">™ MZANSI CITY</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`font-display uppercase tracking-wider text-xs px-3 py-2 border transition-colors ${
                  active
                    ? "text-volt border-volt/40 bg-volt/5"
                    : "text-mute border-transparent hover:text-ink hover:border-line"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/upload"
            className={`hidden sm:inline-flex font-display uppercase tracking-wider text-xs px-3 py-2 border transition-colors ${
              pathname.startsWith("/upload")
                ? "text-sky border-sky/40 bg-sky/5"
                : "text-mute border-transparent hover:text-ink hover:border-line"
            }`}
          >
            UPLOAD
          </Link>
        </nav>

        {user && (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/profile/${user.id}`}
              className="hidden sm:flex items-center gap-2 border border-volt/30 bg-volt/5 px-3 py-1.5 clip-hud-sm hover:border-volt/60 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-gold" />
              <PTS value={user.balance} size="sm" />
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 border border-line px-2 py-1.5 clip-hud-sm hover:border-ink/40 transition-colors"
              >
                <Avatar name={user.displayName} avatarUrl={user.avatarUrl} frameColor={frameColor(user)} size={26} />
                <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate">{user.displayName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-dim" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 panel p-1.5 z-50 shadow-panel">
                  <MenuLink href={`/profile/${user.id}`} icon={<User className="w-4 h-4" />} label="Profile / Wallet" />
                  <MenuLink href="/shop" icon={<ShoppingBag className="w-4 h-4" />} label="Shop" />
                  <MenuLink href="/map" icon={<MapIcon className="w-4 h-4" />} label="City Map" />
                  <MenuLink href="/leaderboard" icon={<Trophy className="w-4 h-4" />} label="Leaderboards" />
                  <MenuLink href="/upload" icon={<UploadCloud className="w-4 h-4" />} label="Upload a note" />
                  {user.role === "admin" && (
                    <MenuLink href="/admin" icon={<Shield className="w-4 h-4" />} label="Moderation" tone="blood" />
                  )}
                  <button
                    onClick={() => void logout()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-blood hover:bg-blood/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function frameColor(user: { equippedFrameId: string | null }): string | null {
  switch (user.equippedFrameId) {
    case "frame-volt":
      return "#A6FF3F";
    case "frame-gold":
      return "#FFC24B";
    case "frame-blood":
      return "#FF4D5E";
    case "frame-sky":
      return "#43D9FF";
    default:
      return null;
  }
}

function MenuLink({ href, icon, label, tone }: { href: string; icon: React.ReactNode; label: string; tone?: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
        tone === "blood" ? "text-blood hover:bg-blood/10" : "text-ink hover:bg-surface-3"
      }`}
    >
      {icon} {label}
    </Link>
  );
}
