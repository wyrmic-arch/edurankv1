"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { Spinner } from "@/components/hud";
import { OnboardingBanner } from "@/components/onboarding-banner";
import { HolidayBanner } from "@/components/holiday-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // AuthProvider lives in the root layout — do not nest a second one here or
  // the two states desync (e.g. stale user after logout).
  return (
    <RequireAuth>
      <Navbar />
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-28 sm:pb-32">
        <HolidayBanner />
        <OnboardingBanner />
        {children}
      </main>
    </RequireAuth>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, authError, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Never bounce to /login while we still have a session but couldn't reach
    // the API — that would log the user out over a flaky connection.
    if (!loading && !user && !authError) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, authError, router, pathname]);

  if (loading) return <Spinner label="LOADING…" />;
  if (!user && authError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="w-8 h-8 text-mark" />
        <div>
          <div className="font-medium">Still signing you in.</div>
          <p className="text-mute text-[13px] mt-1 max-w-sm">{authError}</p>
        </div>
        <button onClick={() => void refresh()} className="btn-mark">TRY AGAIN</button>
      </div>
    );
  }
  if (!user) return <Spinner label="REDIRECTING…" />;
  return <>{children}</>;
}