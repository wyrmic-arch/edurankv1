import type { Metadata } from "next";
import Link from "next/link";
import { fetchStudyHub, prettifySubject } from "@/lib/study";

export const runtime = "edge";

export async function generateMetadata({ params }: { params: { grade: string; subject: string } }): Promise<Metadata> {
  const grade = Number(params.grade) || 11;
  const name = prettifySubject(params.subject);
  return {
    title: `Grade ${grade} ${name} notes — free`,
    description: `Free, original CAPS-aligned Grade ${grade} ${name} study notes from the EduRank team. Read online or download the PDF.`,
    alternates: { canonical: `/study/${params.grade}/${params.subject}` },
  };
}

export default async function StudyHub({ params }: { params: { grade: string; subject: string } }) {
  const grade = Number(params.grade) || 11;
  const subject = params.subject;
  const items = await fetchStudyHub(grade, subject);
  const subjectName = items[0]?.subjectName ?? prettifySubject(subject);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Grade ${grade} ${subjectName} study notes`,
    description: `Free Grade ${grade} ${subjectName} study notes.`,
    url: `https://edurank.co.za/study/${grade}/${subject}`,
    isPartOf: { "@type": "WebSite", name: "EduRank", url: "https://edurank.co.za" },
  };

  return (
    <div className="min-h-screen bg-night text-ash">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-16">
        <nav className="label mb-6">
          <Link href="/study" className="no-underline hover:text-ash">FREE NOTES</Link>
          <span className="mx-2 text-dim">/</span>
          <span>GRADE {grade} {subjectName.toUpperCase()}</span>
        </nav>

        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none">
          Grade {grade} {subjectName} notes.
        </h1>
        <p className="text-ghost text-[16px] leading-relaxed mt-4">
          Free, original, CAPS-aligned {subjectName} notes for Grade {grade}. Read online or download the PDF.
        </p>

        <div className="rule my-10" />

        {items.length === 0 ? (
          <p className="text-mute text-[14px] py-10 text-center border border-dashed border-ruleSoft">
            No guides here yet.{" "}
            <Link href="/study" className="text-accent no-underline hover:underline">See all subjects →</Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.slug}>
                <Link
                  href={`/study/${grade}/${subject}/${it.slug}`}
                  className="panel p-5 block no-underline hover:bg-ink hover:text-paper transition-colors"
                >
                  <div className="font-medium text-lg leading-tight">{it.title}</div>
                  <p className="text-mute text-[13px] mt-1.5">{it.description}</p>
                  {it.topic && <div className="label !text-[9px] mt-2">{it.topic.toUpperCase()}</div>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
