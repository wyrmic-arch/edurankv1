"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { POINTS_RULES } from "@edurank/shared";

export default function UploadSuccess() {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <CheckCircle2 className="w-10 h-10 mx-auto text-mark mb-5" />
      <div className="label mb-2">TRANSMISSION RECEIVED</div>
      <h1 className="font-serif text-4xl font-medium tracking-tight leading-tight">Your note is in the queue.</h1>
      <p className="text-mute mt-4 leading-relaxed">
        A moderator will review it shortly. The moment it clears,{" "}
        <span className="font-mono font-bold">{POINTS_RULES.UPLOAD_APPROVED} PTS</span> lands in your wallet — and every
        download after that keeps paying.
      </p>
      <div className="flex justify-center gap-3 mt-8">
        <Link href="/map" className="btn-ghost">Back to the map</Link>
        <Link href="/upload" className="btn-solid">Upload another</Link>
      </div>
    </div>
  );
}