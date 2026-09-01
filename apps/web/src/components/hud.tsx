"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`panel panel-shadow ${className}`}>{children}</div>;
}

export function SectionTitle({
  kicker,
  title,
  right,
}: {
  kicker?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {kicker && <div className="hud-label mb-1">{kicker}</div>}
        <h2 className="font-display text-2xl md:text-3xl uppercase tracking-wide">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function PTS({ value, tone = "volt", size = "md" }: { value: number; tone?: "volt" | "gold" | "blood" | "ink"; size?: "sm" | "md" | "lg" }) {
  const tones = {
    volt: "text-volt",
    gold: "text-gold",
    blood: "text-blood",
    ink: "text-ink",
  } as const;
  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
  } as const;
  return (
    <span className={`font-mono font-semibold tracking-wide ${tones[tone]} ${sizes[size]}`}>
      {value.toLocaleString("en-ZA")} <span className="text-[0.8em] opacity-80">PTS</span>
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-mute">
      <Loader2 className="w-6 h-6 animate-spin text-volt" />
      {label && <div className="hud-label">{label}</div>}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Panel className="p-6 border-blood/40">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-blood shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-display uppercase text-blood tracking-wider">Transmission failed</div>
          <p className="text-mute text-sm mt-1">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-ghost mt-4 !py-1.5 !px-3 text-xs">
              Retry
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line clip-hud p-10 text-center">
      <Inbox className="w-6 h-6 mx-auto text-dim mb-3" />
      <div className="font-display uppercase tracking-wider text-lg">{title}</div>
      {hint && <p className="text-mute text-sm mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Mission-style progress bar */
export function Progress({ value, target, color = "#A6FF3F" }: { value: number; target: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return (
    <div className="h-2 bg-surface-3 border border-line relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 transition-all duration-500"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}66` }}
      />
    </div>
  );
}

/** Countdown to SAST midnight for daily resets */
export function useMidnightCountdown(): string {
  const [label, setLabel] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      // SAST is fixed at UTC+2 (no DST). The next SAST midnight is the
      // moment when the current SAST wall-clock day rolls over.
      // Trick: shift the current UTC time forward by 2h, take the start of
      // the next UTC day, then shift back. That gives the next SAST midnight
      // as a UTC ms timestamp.
      const now = Date.now();
      const sastNow = now + 2 * 3600 * 1000; // pretend UTC is actually SAST
      const startOfNextUtcDay = Math.ceil(sastNow / 86_400_000) * 86_400_000;
      const targetUtcMs = startOfNextUtcDay - 2 * 3600 * 1000; // shift back
      const diff = Math.max(0, targetUtcMs - now);
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setLabel(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return label;
}

export function FormField({
  label,
  type,
  value,
  onChange,
  required,
  autoFocus,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="hud-label block mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        className="w-full px-3 py-2.5 clip-hud-sm"
      />
    </label>
  );
}
