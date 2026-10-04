import Link from "next/link";

const LINKS = [
  { href: "/about", label: "ABOUT" },
  { href: "/terms", label: "TERMS" },
  { href: "/privacy", label: "PRIVACY" },
  { href: "/cookies", label: "COOKIES" },
  { href: "/guidelines", label: "GUIDELINES" },
  { href: "/copyright", label: "COPYRIGHT" },
  { href: "/accessibility", label: "ACCESSIBILITY" },
  { href: "/security", label: "SECURITY" },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-cinder mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="label no-underline hover:text-ash">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-5">
          <a href="mailto:jacquesdup90@gmail.com" className="label no-underline hover:text-ash">
            CONTACT
          </a>
          <span className="label">© EDURANK · 2026 · SOUTH AFRICA</span>
        </div>
      </div>
    </footer>
  );
}
