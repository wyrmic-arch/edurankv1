"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="min-h-screen bg-night text-ash flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-md text-center">
        <div className="label mb-4">SOMETHING BROKE</div>
        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mb-6 text-ash">Off the rails.</h1>
        <p className="text-ghost text-body mb-10">
          We hit an error loading this page. Try again, or head back to base.
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={reset} className="btn-solid">
            TRY AGAIN
          </button>
          <Link href="/" className="btn-ghost">
            BACK TO BASE
          </Link>
        </div>
      </div>
    </div>
  );
}
