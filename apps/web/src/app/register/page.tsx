"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store";
import { GRADES, POINTS_RULES } from "@edurank/shared";
import { Spinner } from "@/components/hud";
import { PasswordField } from "@/components/password-field";
import { AsciiLogo } from "@/components/ascii-logo";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        grade: grade ? Number(grade) : null,
        referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : null,
      });
      router.replace("/leaderboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          <div className="label mb-2">EARLY ACCESS · NEW PLAYER</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-3">Join the arena.</h1>
          <div className="hairline border-cinder bg-oil px-3 py-2.5 mb-8 flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-label text-ash border border-cinder px-2 py-0.5">FOUNDER</span>
            <p className="text-ghost text-[12px] leading-snug">
              Early-access signups are FOUNDERs for life — a permanent badge and{" "}
              <span className="font-mono text-ash font-bold">+{POINTS_RULES.FOUNDER_BONUS} PTS</span> on the house.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <F label="Player name" hint="3–24 characters. This is what other players see.">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={3} maxLength={24} className="w-full px-3 py-2.5 text-body" autoFocus />
            </F>
            <F label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 text-body" />
            </F>
            <F label="Password" hint="8+ characters.">
              <PasswordField value={password} onChange={setPassword} />
            </F>

            <F label="Grade" hint="You can pick your school from your profile after you&rsquo;re in.">
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-3 py-2.5 text-body">
                <option value="">—</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </F>

            <F label="Referral code (optional)" hint={`+${POINTS_RULES.REFERRAL_BONUS} PTS for you and your recruiter.`}>
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="w-full px-3 py-2.5 font-mono uppercase text-body"
              />
            </F>

            {error && <p className="text-mark text-[13px] border border-mark bg-mark/5 px-3 py-2">{error}</p>}

            <button disabled={busy} type="submit" className="btn-mark w-full">
              {busy ? "CREATING PROFILE…" : "JOIN & ENTER"}
            </button>
          </form>

          <p className="text-mute text-[13px] mt-8 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-ash no-underline hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label block mb-2">{label}</span>
      {children}
      {hint && <span className="text-dim text-[11px] mt-1.5 block">{hint}</span>}
    </label>
  );
}