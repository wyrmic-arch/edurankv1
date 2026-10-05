import Link from "next/link";
import { AsciiLogo } from "./ascii-logo";

const GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Study",
    links: [
      { href: "/study", label: "Free notes" },
      { href: "/roadmap", label: "Roadmap" },
      { href: "/register", label: "Join the arena" },
    ],
  },
  {
    title: "EduRank",
    links: [
      { href: "/about", label: "About" },
      { href: "/mission", label: "Mission" },
      { href: "/feedback", label: "Ideas & feedback" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
      { href: "/guidelines", label: "Guidelines" },
      { href: "/copyright", label: "Copyright" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/security", label: "Security" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-cinder mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-flex no-underline">
              <AsciiLogo size="sm" />
            </Link>
            <p className="text-dim text-[12px] mt-4 max-w-[220px] leading-relaxed">
              South Africa&rsquo;s free study notes arena for grades 8&ndash;12. Earn points, unlock notes, climb
              the board.
            </p>
          </div>

          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="label mb-3">{group.title}</div>
              <ul className="space-y-2">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-ghost no-underline hover:text-ash transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rule mt-10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="label">&copy; EDURANK &middot; 2026 &middot; SOUTH AFRICA</span>
          <a href="mailto:studyedurank@gmail.com" className="label no-underline hover:text-ash">
            studyedurank@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
