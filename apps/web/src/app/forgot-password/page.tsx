"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { AsciiLogo } from "@/components/ascii-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-night flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-10 no-underline">
          <AsciiLogo size="lg" />
        </Link>

        <div className="panel p-8">
          <div className="label mb-2">RESET PASSWORD</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-8">Forgot your password?</h1>

          {sent ? (
            <div className="space-y-4">
              <p className="text-ash text-[14px] leading-relaxed">
                If an account exists for <span className="font-mono text-mark">{email}</span>, we&rsquo;ve sent a
                reset link. Check your inbox and spam folder.
              </p>
              <Link href="/login" className="btn-solid w-full justify-center">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <label className="block">
                <span className="label block mb-2">EMAIL</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 bg-oil text-ash text-body border border-cinder"
                />
              </label>

              {error && <p className="text-mark text-[13px] border border-mark bg-mark/5 px-3 py-2">{error}</p>}

              <button disabled={busy} type="submit" className="btn-solid w-full">
                {busy ? "SENDING…" : "SEND RESET LINK"}
              </button>

              <p className="text-mute text-[13px] text-center">
                Remembered it?{" "}
                <Link href="/login" className="text-ash no-underline hover:underline font-medium">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
