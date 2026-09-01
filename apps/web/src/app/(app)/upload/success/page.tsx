"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { POINTS_RULES } from "@edurank/shared";

export default function UploadSuccess() {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <CheckCircle2 className="w-12 h-12 mx-auto text-volt mb-5" />
      <div className="hud-label mb-2">TRANSMISSION RECEIVED</div>
      <h1 className="font-display uppercase text-4xl leading-tight">Your note is in the queue</h1>
      <p className="text-mute mt-4 leading-relaxed">
        A moderator will review it shortly. The moment it clears,{" "}
        <span className="font-mono text-volt">{POINTS_RULES.UPLOAD_APPROVED} PTS</span> lands in your wallet — and every
        download after that keeps paying.
      </p>
      <div className="flex justify-center gap-3 mt-8">
        <Link href="/map" className="btn-ghost">Back to the map</Link>
        <Link href="/upload" className="btn-volt">Upload another</Link>
      </div>
    </div>
  );
}
