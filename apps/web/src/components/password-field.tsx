"use client";

import { useState } from "react";

export function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={8}
        className="w-full px-3 py-2.5 bg-oil text-ash text-body pr-12 border border-cinder"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-label border border-cinder px-2 py-1 hover:border-ash hover:text-ash text-ghost bg-oil"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? "HIDE" : "SHOW"}
      </button>
    </span>
  );
}
