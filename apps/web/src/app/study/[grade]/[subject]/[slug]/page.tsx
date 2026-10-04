import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchStudyHub, fetchStudyNote, studyFileUrl, prettifySubject } from "@/lib/study";

export const runtime = "edge";

const SITE = "https://edurank.co.za";

export async function generateMetadata({
  params,
}: {
  params: { grade: string; subject: string; slug: string };
}): Promise<Metadata> {
  const grade = Number(params.grade) || 11;
  const note = await fetchStudyNote(grade, params.subject, params.slug);
  if (!note) return { title: "Guide not found" };
  const url = `/study/${params.grade}/${params.subject}/${params.slug}`;
  return {
    title: note.title,
    description: note.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: note.title,
      description: note.description,
      url,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: note.title }],
    },
  };
}

export default async function StudyNotePage({
  params,
}: {
  params: { grade: string; subject: string; slug: string };
}) {
  const grade = Number(params.grade) || 11;
  const { subject, slug } = params;
  const note = await fetchStudyNote(grade, subject, slug);
  if (!note) notFound();

  const subjectName = note.subjectName || prettifySubject(subject);
  const url = `${SITE}/study/${grade}/${subject}/${slug}`;
  const related = (await fetchStudyHub(grade, subject)).filter((i) => i.slug !== slug).slice(0, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: note.title,
    description: note.description,
    url,
    inLanguage: "en-ZA",
    educationalLevel: `Grade ${grade}`,
    learningResourceType: "Study guide",
    isAccessibleForFree: true,
    about: subjectName,
    ...(note.topic ? { teaches: note.topic } : {}),
    provider: { "@type": "Organization", name: "EduRank", url: SITE },
    author: { "@type": "Organization", name: "EduRank Team" },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Free notes", item: `${SITE}/study` },
      { "@type": "ListItem", position: 2, name: `Grade ${grade} ${subjectName}`, item: `${SITE}/study/${grade}/${subject}` },
      { "@type": "ListItem", position: 3, name: note.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-night text-ash">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="max-w-[820px] mx-auto px-6 py-16">
        <nav className="label mb-6 flex flex-wrap gap-2">
          <Link href="/study" className="no-underline hover:text-ash">FREE NOTES</Link>
          <span className="text-dim">/</span>
          <Link href={`/study/${grade}/${subject}`} className="no-underline hover:text-ash">
            GRADE {grade} {subjectName.toUpperCase()}
          </Link>
        </nav>

        <div className="label !text-[9px] inline-flex items-center gap-1.5 border border-accent text-accent px-2 py-0.5">
          OFFICIAL · EDURANK TEAM
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight mt-3">{note.title}</h1>
        <p className="text-ghost text-[16px] leading-relaxed mt-4">{note.description}</p>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <a href={studyFileUrl(grade, subject, slug)} target="_blank" rel="noreferrer" className="btn-solid !text-[11px]">
            DOWNLOAD PDF
          </a>
          <span className="label !text-[9px]">GRADE {grade} · {subjectName.toUpperCase()}</span>
          {note.topic && <span className="label !text-[9px]">{note.topic.toUpperCase()}</span>}
        </div>

        <div className="rule my-8" />

        <article className="study-body" dangerouslySetInnerHTML={{ __html: note.body }} />

        {related.length > 0 && (
          <div className="mt-14">
            <div className="label mb-4">MORE GRADE {grade} {subjectName.toUpperCase()}</div>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/study/${grade}/${subject}/${r.slug}`}
                    className="no-underline flex items-baseline justify-between gap-4 py-2 border-b border-smoke hover:border-accent"
                  >
                    <span className="text-ash">{r.title}</span>
                    <span className="label !text-[9px] shrink-0">READ →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="label mt-12">
          OFFICIAL EDURANK TEAM NOTES · ALWAYS CROSS-CHECK WITH YOUR TEXTBOOK ·{" "}
          <Link href="/register" className="text-accent no-underline hover:underline">JOIN EDURANK →</Link>
        </p>
      </div>
    </div>
  );
}
