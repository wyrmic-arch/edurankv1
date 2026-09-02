"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/hud";
import { PasswordField } from "@/components/password-field";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token || !email) {
      setError("This reset link is incomplete. Request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password needs at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword(token, email, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-night flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="block mb-10 no-underline">
          <img src="/logo.png" alt="EduRank" className="h-14 w-auto mx-auto inverted-logo" />
        </Link>

        <div className="panel p-8">
          <div className="label mb-2">NEW PASSWORD</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-8">Set a new password.</h1>

          {done ? (
            <div className="space-y-4">
              <p className="text-ash text-[14px] leading-relaxed">
                Your password has been updated. You can now sign in.
              </p>
              <Link href="/login" className="btn-solid w-full justify-center">Sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <label className="block">
                <span className="label block mb-2">NEW PASSWORD</span>
                <PasswordField value={password} onChange={setPassword} />
              </label>
              <label className="block">
                <span className="label block mb-2">CONFIRM PASSWORD</span>
                <PasswordField value={confirm} onChange={setConfirm} />
              </label>

              {error && <p className="text-mark text-[13px] border border-mark bg-mark/5 px-3 py-2">{error}</p>}

              <button disabled={busy} type="submit" className="btn-solid w-full">
                {busy ? "UPDATING…" : "SET PASSWORD"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
