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
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="font-mono text-[15px] font-bold tracking-tight block mb-10 text-center no-underline">
          EDURANK
        </Link>

        <div className="panel p-8">
          <div className="label mb-2">IDENTIFY YOURSELF</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-8">Enter the city.</h1>

          <form onSubmit={submit} className="space-y-5">
            <FormField label="Email" type="email" value={email} onChange={setEmail} required autoFocus />
            <FormField label="Password" type="password" value={password} onChange={setPassword} required />

            {error && (
              <p className={`text-[13px] border px-3 py-2 ${error.toLowerCase().includes("reach") ? "border-ink bg-ink/5" : "border-mark text-mark bg-mark/5"}`}>
                {error}
              </p>
            )}

            <button disabled={busy} type="submit" className="btn-solid w-full">
              {busy ? "CHECKING…" : "LOG IN"}
            </button>
          </form>

          <div className="rule mt-8 pt-6">
            <div className="label mb-3">DEMO ACCOUNTS (SEEDED)</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void submitWith("player1@edurank.co.za", PLAYER_PASSWORD)}
                disabled={busy}
                className="btn-ghost !text-[10px]"
              >
                PLAYER · 1,435 PTS
              </button>
              <button
                type="button"
                onClick={() => void submitWith(ADMIN_EMAIL, ADMIN_PASSWORD)}
                disabled={busy}
                className="btn-ghost !text-[10px]"
              >
                ADMIN / MODERATOR
              </button>
            </div>
          </div>

          <p className="text-mute text-[13px] mt-8 text-center">
            New here?{" "}
            <Link href="/register" className="text-ink no-underline hover:underline font-medium">
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