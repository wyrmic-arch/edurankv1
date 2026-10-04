import Link from "next/link";
import type { ReactNode } from "react";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/guidelines", label: "Guidelines" },
  { href: "/copyright", label: "Copyright" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" },
];

export function LegalPage({
  title,
  updated = "Last updated 4 October 2026",
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-night text-ash">
      <div className="max-w-[760px] mx-auto px-6 py-16">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-label text-ghost no-underline hover:text-ash">
          ← Back to EduRank
        </Link>
        <h1 className="font-serif text-4xl font-medium tracking-tight mt-6 mb-3">{title}</h1>
        <p className="label mb-10">{updated}</p>
        <div className="space-y-8">{children}</div>

        <nav className="rule mt-12 pt-6 flex flex-wrap gap-x-5 gap-y-2">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-mono text-[11px] uppercase tracking-label text-ghost no-underline hover:text-ash">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-mute text-[12px] mt-6">
          Questions? <a href="mailto:questions@edurank.co.za" className="text-ash no-underline hover:underline">questions@edurank.co.za</a>
        </p>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-mono text-[13px] uppercase tracking-label text-ash mb-2">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-ghost">{children}</div>
    </section>
  );
}
