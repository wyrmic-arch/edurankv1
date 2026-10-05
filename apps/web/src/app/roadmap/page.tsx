import type { Metadata } from "next";

export const runtime = "edge";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.edurank.co.za";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "What we're building next on EduRank — feature ideas and improvements, straight from student feedback.",
  alternates: { canonical: "/roadmap" },
};

interface PublicSuggestion {
  title: string;
  body: string;
  status: "planned" | "done" | string;
  category: string;
  updatedAt: string | null;
}

async function fetchRoadmap(): Promise<PublicSuggestion[]> {
  try {
    const res = await fetch(`${API}/suggestions/public`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return ((await res.json()) as { items: PublicSuggestion[] }).items ?? [];
  } catch {
    return [];
  }
}

const GROUPS: { key: string; label: string; hint: string }[] = [
  { key: "planned", label: "Planned", hint: "Coming soon" },
  { key: "done", label: "Shipped", hint: "Already live" },
];

export default async function RoadmapPage() {
  const items = await fetchRoadmap();
  const groupOf = (key: string) => items.filter((i) => i.status === key);

  return (
    <div className="min-h-screen bg-night text-ash">
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-16">
        <div className="label text-accent">ROADMAP</div>
        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-2">What&rsquo;s coming.</h1>
        <p className="text-ghost text-[16px] leading-relaxed mt-4 max-w-xl">
          EduRank keeps improving, and most of it starts as a student suggestion. Here&rsquo;s what&rsquo;s
          planned and what has already shipped.
        </p>

        <div className="rule my-10" />

        {items.length === 0 ? (
          <p className="text-mute text-[14px] py-10 text-center border border-dashed border-ruleSoft">
            The roadmap is being drawn up. Have an idea? Submit one from your dashboard.
          </p>
        ) : (
          GROUPS.map((g) => {
            const rows = groupOf(g.key);
            return (
              <section key={g.key} className="mb-10">
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="font-mono text-[13px] uppercase tracking-label text-ash">{g.label}</h2>
                  <span className="label !text-[9px]">{g.hint}</span>
                  <span className="flex-1 h-px bg-cinder" />
                  <span className="label !text-[9px]">{rows.length}</span>
                </div>
                {rows.length === 0 ? (
                  <p className="text-mute text-[13px]">Nothing here yet.</p>
                ) : (
                  <ul className="panel divide-y divide-ruleSoft">
                    {rows.map((s, i) => (
                      <li key={i} className="p-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                              s.status === "done" ? "bg-ash" : "bg-accent"
                            }`}
                          />
                          <div>
                            <div className="font-medium">{s.title}</div>
                            {s.body && <p className="text-mute text-[13px] mt-0.5">{s.body}</p>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        )}

        <p className="label mt-6">
          GOT AN IDEA?{" "}
          <a href="/feedback" className="text-accent no-underline hover:underline">SUBMIT IT →</a>
        </p>
      </div>
    </div>
  );
}
