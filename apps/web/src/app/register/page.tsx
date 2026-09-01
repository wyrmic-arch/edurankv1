"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store";
import { api, type School } from "@/lib/api";
import { GRADES } from "@edurank/shared";
import { Spinner } from "@/components/hud";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [schoolId, setSchoolId] = useState<string>("");
  const [referralCode, setReferralCode] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.schools().then((r) => setSchools(r.items)).catch(() => {});
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
        schoolId: schoolId || null,
        referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : null,
      });
      router.replace("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          <div className="label mb-2">NEW PLAYER REGISTRATION</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight mb-8">Enlist free.</h1>

          <form onSubmit={submit} className="space-y-5">
            <F label="Player name" hint="3–24 characters. This is what the city sees.">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={3} maxLength={24} className="w-full px-3 py-2.5 text-body" autoFocus />
            </F>
            <F label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 text-body" />
            </F>
            <F label="Password" hint="8+ characters.">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2.5 text-body" />
            </F>

            <div className="grid grid-cols-2 gap-4">
              <F label="Grade">
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-3 py-2.5 text-body">
                  <option value="">—</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </F>
              <F label="School">
                <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="w-full px-3 py-2.5 text-body">
                  <option value="">—</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </F>
            </div>

            <F label="Referral code (optional)" hint="+100 PTS for you and your recruiter.">
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="w-full px-3 py-2.5 font-mono uppercase text-body"
              />
            </F>

            {error && <p className="text-mark text-[13px] border border-mark bg-mark/5 px-3 py-2">{error}</p>}

            <button disabled={busy} type="submit" className="btn-solid w-full">
              {busy ? "CREATING FILE…" : "ENLIST & ENTER"}
            </button>
          </form>

          <p className="text-mute text-[13px] mt-8 text-center">
            Already enlisted?{" "}
            <Link href="/login" className="text-ink no-underline hover:underline font-medium">
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