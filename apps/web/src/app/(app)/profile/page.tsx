"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { Spinner } from "@/components/hud";

export default function ProfileIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace(`/profile/${user.id}`);
  }, [loading, user, router]);

  return <Spinner label="OPENING YOUR FILE…" />;
}
