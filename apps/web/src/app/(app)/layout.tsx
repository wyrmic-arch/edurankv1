"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { MiniMap } from "@/components/minimap";
import { Spinner } from "@/components/hud";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RequireAuth>
        <Navbar />
        <main className="max-w-[1400px] mx-auto px-6 py-10 pb-32">{children}</main>
        <ActiveMiniMap />
      </RequireAuth>
    </AuthProvider>
  );
}

function ActiveMiniMap() {
  const pathname = usePathname();
  const match = pathname.match(/^\/district\/([\w-]+)/);
  return <MiniMap active={match?.[1]} />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading) return <Spinner label="ENTERING MZANSI CITY…" />;
  if (!user) return <Spinner label="REDIRECTING…" />;
  return <>{children}</>;
}