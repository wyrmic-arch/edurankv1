"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldAlert, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";

/**
 * First-run nudges for signed-in users:
 *  - If their email isn't verified, prompt with a resend action.
 *  - If they have no school set, point them to pick one on their profile.
 */
export function OnboardingBanner() {
  const { user } = useAuth();
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const needEmail = !user.emailVerified;
  const needSchool = !user.schoolId;

  if (!needEmail && !needSchool) return null;

  async function resend() {
    setError(null);
    setResent(true);
    try {
      await api.resendVerification();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend.");
    }
  }

  return (
    <div className="mb-6 space-y-3">
      {needEmail && (
        <div className="panel p-4 border-mark flex flex-wrap items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-mark shrink-0" />
          <div className="flex-1 min-w-[220px]">
            <div className="font-medium text-ash">Verify your email</div>
            <p className="text-ghost text-[13px] mt-0.5">
              We sent you a confirmation link. Check your inbox to make sure it&rsquo;s really you.
            </p>
            {error && <p className="text-mark text-[12px] mt-1">{error}</p>}
          </div>
          <button onClick={() => void resend()} disabled={resent} className="btn-ghost !text-[10px]">
            {resent ? "SENT ✓" : "RESEND"}
          </button>
        </div>
      )}

      {needSchool && (
        <div className="panel p-4 flex flex-wrap items-center gap-3">
          <UserCheck className="w-4 h-4 text-ash shrink-0" />
          <div className="flex-1 min-w-[220px]">
            <div className="font-medium text-ash">Set your school</div>
            <p className="text-ghost text-[13px] mt-0.5">
              Pick your school so it shows on your profile and the leaderboard.
            </p>
          </div>
          <Link href="/profile" className="btn-solid !text-[10px]">CHOOSE SCHOOL</Link>
        </div>
      )}
    </div>
  );
}
