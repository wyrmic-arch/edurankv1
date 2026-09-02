"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { Spinner } from "@/components/hud";
import { OnboardingBanner } from "@/components/onboarding-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RequireAuth>
        <Navbar />
        <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-10 pb-32">
          <OnboardingBanner />
          {children}
        </main>
      </RequireAuth>
    </AuthProvider>
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