"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { Spinner } from "@/components/hud";
import { OnboardingBanner } from "@/components/onboarding-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // AuthProvider lives in the root layout — do not nest a second one here or
  // the two states desync (e.g. stale user after logout).
  return (
    <RequireAuth>
      <Navbar />
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-28 sm:pb-32">
        <OnboardingBanner />
        {children}
      </main>
    </RequireAuth>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading) return <Spinner label="LOADING…" />;
  if (!user) return <Spinner label="REDIRECTING…" />;
  return <>{children}</>;
}