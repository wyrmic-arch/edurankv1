"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`panel ${className}`}>{children}</div>;
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
    <div className="flex items-end justify-between gap-6 mb-6">
      <div>
        {kicker && <div className="label mb-2">{kicker}</div>}
        <h2 className="font-sans text-3xl font-medium tracking-tight">{title}</h2>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function PTS({ value, tone = "ink", size = "md" }: { value: number; tone?: "ink" | "mark" | "ok"; size?: "sm" | "md" | "lg" }) {
  const tones = {
    ink: "text-ash",
    mark: "text-mark",
    ok: "text-ok",
  } as const;
  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-2xl",
  } as const;
  return (
    <span className={`font-mono font-bold tabular-nums ${tones[tone]} ${sizes[size]}`}>
      {value.toLocaleString("en-ZA")}
      <span className="ml-1 text-[0.7em] font-normal text-mute">PTS</span>
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-mute">
      <Loader2 className="w-5 h-5 animate-spin" />
      {label && <div className="label">{label}</div>}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Panel className="p-6 border-mark">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-mark shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-medium">Could not load.</div>
          <p className="text-mute text-sm mt-1">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-ghost mt-4">
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
    <div className="border border-dashed border-ruleSoft p-10 text-center">
      <Inbox className="w-5 h-5 mx-auto text-dim mb-3" />
      <div className="font-medium">{title}</div>
      {hint && <p className="text-mute text-sm mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Progress({ value, target }: { value: number; target: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return (
    <div className="h-px bg-smoke relative">
      <div
        className="absolute inset-y-0 left-0 bg-ash transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Countdown to SAST midnight for daily resets */
export function useMidnightCountdown(): string {
  const [label, setLabel] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const sastNow = now + 2 * 3600 * 1000;
      const startOfNextUtcDay = Math.ceil(sastNow / 86_400_000) * 86_400_000;
      const targetUtcMs = startOfNextUtcDay - 2 * 3600 * 1000;
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
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="block">
      <span className="label block mb-2">{label}</span>
      <span className="relative block">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoFocus={autoFocus}
          className="w-full px-3 py-2.5 bg-oil text-ash text-body pr-12"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-label border border-cinder px-2 py-1 hover:border-ash hover:text-ash text-ghost bg-oil"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "HIDE" : "SHOW"}
          </button>
        )}
      </span>
    </label>
  );
}