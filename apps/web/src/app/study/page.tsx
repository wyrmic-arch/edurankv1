import type { Metadata } from "next";
import Link from "next/link";
import { fetchStudyIndex } from "@/lib/study";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Free study notes (Grades 11–12)",
  description:
    "Free, original CAPS-aligned study notes for Grade 11 and 12 Mathematics, Physical Sciences, Life Sciences and Accounting — written by the EduRank team.",
  alternates: { canonical: "/study" },
};

export default async function StudyIndex() {
  const items = await fetchStudyIndex();

  const groups = new Map<string, { grade: number; subjectId: string; subjectName: string; count: number }>();
  for (const it of items) {
    const key = `${it.grade}/${it.subjectId}`;
    const g = groups.get(key) ?? { grade: it.grade, subjectId: it.subjectId, subjectName: it.subjectName, count: 0 };
    g.count += 1;
    groups.set(key, g);
  }
  const list = [...groups.values()].sort((a, b) => a.grade - b.grade || a.subjectName.localeCompare(b.subjectName));

  return (
    <div className="min-h-screen bg-night text-ash">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16">
        <div className="label">FREE · WRITTEN BY THE EDURANK TEAM</div>
        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-2">Free study notes.</h1>
        <p className="text-ghost text-[16px] leading-relaxed mt-4 max-w-2xl">
          Original, CAPS-aligned notes for Grade 11 and 12 — free to read, for everyone. Written and
          maintained by the EduRank team, with a downloadable PDF for each guide.
        </p>

        <div className="rule my-10" />

        {list.length === 0 ? (
          <p className="text-mute text-[14px] py-10 text-center border border-dashed border-ruleSoft">
            Notes are being published — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((g) => (
              <Link
                key={`${g.grade}/${g.subjectId}`}
                href={`/study/${g.grade}/${g.subjectId}`}
                className="panel p-5 no-underline hover:bg-ink hover:text-paper transition-colors"
              >
                <div className="label !text-[9px]">GRADE {g.grade}</div>
                <div className="font-medium text-lg mt-1 leading-tight">{g.subjectName}</div>
                <div className="label !text-[9px] mt-2">{g.count} {g.count === 1 ? "guide" : "guides"}</div>
              </Link>
            ))}
          </div>
        )}

        <p className="label mt-14">
          WANT THE WHOLE COMMUNITY ARCHIVE?{" "}
          <Link href="/register" className="text-accent no-underline hover:underline">
            JOIN EDURANK →
          </Link>
        </p>
      </div>
    </div>
  );
}
