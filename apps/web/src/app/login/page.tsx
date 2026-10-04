"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/store";
import { Spinner, FormField } from "@/components/hud";
import { AsciiLogo } from "@/components/ascii-logo";

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  // Only accept same-site absolute paths — never a scheme or protocol-relative
  // URL (prevents /login?next=https://evil.com open redirects).
  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/leaderboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password first.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          <div className="label mb-2">SIGN IN</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-8">Welcome back.</h1>

          <form onSubmit={submit} className="space-y-5">
            <FormField label="Email" type="email" value={email} onChange={setEmail} required autoFocus />
            <FormField label="Password" type="password" value={password} onChange={setPassword} required />

            {error && (
              <p className="text-[13px] border px-3 py-2 border-mark text-mark bg-mark/5">
                {error}
              </p>
            )}

            <button disabled={busy} type="submit" className="btn-mark w-full">
              {busy ? "SIGNING IN…" : "SIGN IN"}
            </button>
          </form>

          <div className="flex items-center justify-between mt-5">
            <Link href="/forgot-password" className="font-mono text-[11px] uppercase tracking-label text-ghost hover:text-ash no-underline">
              Forgot password?
            </Link>
            <Link href="/register" className="font-mono text-[11px] uppercase tracking-label text-ash no-underline hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
