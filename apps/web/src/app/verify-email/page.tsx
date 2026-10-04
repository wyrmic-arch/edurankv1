"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/hud";
import { AsciiLogo } from "@/components/ascii-logo";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <VerifyForm />
    </Suspense>
  );
}

function VerifyForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage("This verification link is incomplete. Request a new one.");
      return;
    }
    let live = true;
    api
      .verifyEmail(token, email)
      .then(() => live && setStatus("ok"))
      .catch((e) => live && (setStatus("error"), setMessage(e instanceof Error ? e.message : "Verification failed.")));
    return () => {
      live = false;
    };
  }, [token, email]);

  return (
    <div className="min-h-screen bg-night flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-10 no-underline">
          <AsciiLogo size="lg" />
        </Link>

        <div className="panel p-8 text-center">
          {status === "loading" ? (
            <Spinner label="VERIFYING…" />
          ) : status === "ok" ? (
            <div className="space-y-4">
              <div className="font-serif text-3xl font-medium tracking-tight">Email verified.</div>
              <p className="text-ash text-[14px] leading-relaxed">
                Your account is active. Sign in to get started.
              </p>
              <Link href="/login" className="btn-solid w-full justify-center">Sign in</Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="font-serif text-3xl font-medium tracking-tight">Link problem.</div>
              <p className="text-mark text-[14px] leading-relaxed">{message}</p>
              <Link href="/login" className="btn-solid w-full justify-center">Back to sign in</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
