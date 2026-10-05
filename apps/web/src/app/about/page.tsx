import Link from "next/link";
import { Mail, GraduationCap } from "lucide-react";

export const metadata = {
  title: "About — EduRank",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-night text-ash">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-label text-ghost no-underline hover:text-ash">
          ← Back to EduRank
        </Link>
        <h1 className="font-serif text-4xl font-medium tracking-tight mt-6 mb-3">About EduRank</h1>

        <div className="space-y-6 mt-8 text-[15px] leading-relaxed text-ghost">
          <p>
            EduRank is a study notes platform for South African high-school students (grades 8–12). Students
            upload the notes, summaries and exam material that actually helped them, earn points for sharing,
            and use those points to unlock the best material from the top students in the country.
          </p>
          <p>
            It was built by a 20-year-old who watched classmates trade notes and past papers at school — and
            saw how much that informal exchange helped people. EduRank gives that exchange one proper home,
            with a leaderboard, streaks and a points economy to make the grind a little more competitive.
          </p>
          <p>
            Our mission is simple: make the best study material findable, reward the people brave enough to
            share it, and let anyone climb from their own school to the national board.
          </p>
        </div>

        <div className="rule mt-10 pt-6 grid sm:grid-cols-2 gap-6">
          <div className="panel p-6">
            <GraduationCap className="w-5 h-5 text-ash mb-3" />
            <div className="label mb-1">THE PLATFORM</div>
            <p className="text-ghost text-[14px] leading-relaxed">
              Subjects, notes, points, ranks, streaks and challenges — all in one place for SA students.
            </p>
          </div>
          <div className="panel p-6">
            <Mail className="w-5 h-5 text-ash mb-3" />
            <div className="label mb-1">CONTACT</div>
            <p className="text-ghost text-[14px] leading-relaxed break-all">
              jacquesdup90@gmail.com
            </p>
          </div>
        </div>

        <p className="text-dim text-[12px] mt-10 leading-relaxed">
          Uploaded PDFs are compressed in your browser using{" "}
          <a href="https://www.ghostscript.com" className="text-ghost no-underline hover:text-ash" target="_blank" rel="noreferrer">
            Ghostscript
          </a>{" "}
          (AGPL-3.0), compiled to WebAssembly. Maps use OpenFreeMap and OpenStreetMap data.
        </p>
        <p className="text-mute text-[13px] mt-4">By using EduRank you agree to our terms and privacy policy.</p>
      </div>
    </div>
  );
}
