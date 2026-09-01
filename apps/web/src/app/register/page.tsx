"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
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
    <div className="min-h-screen bg-void bg-grid flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-2xl tracking-wider block mb-8 text-center">
          EDU<span className="text-volt">RANK</span>
        </Link>
        <div className="panel p-7">
          <div className="hud-label mb-1">NEW PLAYER REGISTRATION</div>
          <h1 className="font-display text-3xl uppercase mb-6">Enlist free</h1>

          <form onSubmit={submit} className="space-y-4">
            <F label="Player name" hint="3–24 characters. This is what the city sees.">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={3} maxLength={24} className="w-full px-3 py-2.5 clip-hud-sm" autoFocus />
            </F>
            <F label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 clip-hud-sm" />
            </F>
            <F label="Password" hint="8+ characters.">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2.5 clip-hud-sm" />
            </F>

            <div className="grid grid-cols-2 gap-3">
              <F label="Grade">
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-3 py-2.5 clip-hud-sm">
                  <option value="">—</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </F>
              <F label="School">
                <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="w-full px-3 py-2.5 clip-hud-sm">
                  <option value="">—</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </F>
            </div>

            <F label="Referral code (optional)" hint="+100 PTS for you and your recruiter.">
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                <input
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABC123"
                  className="w-full pl-9 pr-3 py-2.5 clip-hud-sm font-mono uppercase"
                />
              </div>
            </F>

            {error && <p className="text-blood text-sm border border-blood/40 bg-blood/5 px-3 py-2 clip-hud-sm">{error}</p>}
            <button disabled={busy} className="btn-volt w-full py-3">
              {busy ? "CREATING FILE…" : "ENLIST & ENTER THE MAP"}
            </button>
          </form>

          <p className="text-mute text-sm mt-6 text-center">
            Already enlisted?{" "}
            <Link href="/login" className="text-volt hover:underline font-medium">
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
      <span className="hud-label block mb-1.5">{label}</span>
      {children}
      {hint && <span className="text-dim text-xs mt-1 block">{hint}</span>}
    </label>
  );
}
