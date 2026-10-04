"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCheck, Fingerprint } from "lucide-react";
import { api, type Certificate } from "@/lib/api";
import { ErrorPanel, Spinner } from "@/components/hud";
import { licenseLabel } from "@edurank/shared";

export const runtime = "edge";

export default function VerifyPage() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.certificate(id).then((r) => setCert(r.certificate)).catch((e) => setError(e.message));
  }, [id]);

  return (
    <div className="min-h-screen bg-night text-ash">
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-label text-ghost no-underline hover:text-ash">
          ← EduRank
        </Link>

        <div className="mt-6 label inline-flex items-center gap-2">
          <Fingerprint className="w-3.5 h-3.5 text-accent" /> PROVENANCE CERTIFICATE
        </div>
        <h1 className="font-serif text-4xl font-medium tracking-tight mt-1 mb-8">Ownership record.</h1>

        {error ? (
          <ErrorPanel message={error} />
        ) : !cert ? (
          <Spinner label="VERIFYING…" />
        ) : (
          <div className="panel p-6 space-y-5">
            <div className="flex items-start gap-3">
              <BadgeCheck className="w-6 h-6 text-accent shrink-0" />
              <div>
                <div className="font-medium text-lg">{cert.title}</div>
                <div className="text-ghost text-[13px]">by {cert.uploaderName}</div>
              </div>
            </div>

            <Row label="Uploaded" value={new Date(cert.uploadedAt).toLocaleString("en-ZA")} />
            <Row label="License" value={licenseLabel(cert.license)} />
            <Row label="SHA-256" value={cert.contentHash ?? "not recorded"} mono />
            <Row label="Signature" value={cert.signature ?? "unsigned (CERT_SECRET not set)"} mono />
            <Row label="Note ID" value={cert.noteId} mono />

            <p className="text-mute text-[12px] leading-relaxed pt-2 border-t border-cinder">
              This record is a timestamped fingerprint of the exact file at upload. It proves the
              content existed and who uploaded it first. Share this page as proof of authorship.
            </p>

            <Link href={`/notes/${cert.noteId}`} className="btn-ghost !text-[11px] inline-flex">
              View the note
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="label !text-[9px]">{label}</div>
      <div className={`mt-0.5 break-all ${mono ? "font-mono text-[12px] text-ghost" : "text-[14px] text-ash"}`}>{value}</div>
    </div>
  );
}
