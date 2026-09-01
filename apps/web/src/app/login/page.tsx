"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/store";
import { Spinner, FormField } from "@/components/hud";

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
  const next = params.get("next") ?? "/map";

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
    <div className="min-h-screen bg-void bg-grid flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-2xl tracking-wider block mb-8 text-center">
          EDU<span className="text-volt">RANK</span>
        </Link>
        <div className="panel p-7">
          <div className="hud-label mb-1">IDENTIFY YOURSELF</div>
          <h1 className="font-display text-3xl uppercase mb-6">Enter the city</h1>

          <form onSubmit={submit} className="space-y-4">
            <FormField label="Email" type="email" value={email} onChange={setEmail} required autoFocus />
            <FormField label="Password" type="password" value={password} onChange={setPassword} required />
            {error && (
              <p className={`text-sm border px-3 py-2 clip-hud-sm ${error.startsWith("Can't reach") ? "border-gold/50 bg-gold/5 text-gold" : "border-blood/40 bg-blood/5 text-blood"}`}>
                {error}
              </p>
            )}
            <button disabled={busy} className="btn-volt w-full py-3">
              {busy ? "CHECKING CREDENTIALS…" : "LOG IN"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line">
            <div className="hud-label mb-2">DEMO ACCOUNTS (SEEDED)</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void submitWith("player1@edurank.co.za", PLAYER_PASSWORD)}
                disabled={busy}
                className="btn-ghost !py-2 text-[11px]"
              >
                PLAYER · 1 435 PTS
              </button>
              <button
                type="button"
                onClick={() => void submitWith(ADMIN_EMAIL, ADMIN_PASSWORD)}
                disabled={busy}
                className="btn-ghost !py-2 text-[11px] !border-blood/40 hover:!border-blood"
              >
                ADMIN / MODERATOR
              </button>
            </div>
          </div>

          <p className="text-mute text-sm mt-6 text-center">
            New here?{" "}
            <Link href="/register" className="text-volt hover:underline font-medium">
              Enlist free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );

  async function submitWith(demoEmail: string, demoPassword: string) {
    setError(null);
    setBusy(true);
    try {
      await login(demoEmail, demoPassword);
      router.replace(demoEmail === ADMIN_EMAIL ? "/admin" : "/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }
}

const PLAYER_PASSWORD = "Password#2026";
const ADMIN_PASSWORD = "Admin#2026";
const ADMIN_EMAIL = "admin@edurank.co.za";
