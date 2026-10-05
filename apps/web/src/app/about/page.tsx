import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  Users,
} from "lucide-react";

export const metadata = {
  title: "About",
  description:
    "What EduRank is, how to use it, and what it offers: a free study-notes arena for South African students in grades 8–12.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-night text-ash">
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-label text-ghost no-underline hover:text-ash">
          ← Back to EduRank
        </Link>

        <div className="label mt-8 mb-2">ABOUT</div>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight leading-tight">
          What EduRank is.
        </h1>
        <p className="text-[17px] text-ghost leading-relaxed mt-5 max-w-2xl">
          EduRank is a free study-notes arena for South African high-school students (grades 8–12). Students
          share the notes, summaries and past-paper answers that actually helped them, earn points for
          contributing, and spend those points to unlock the best material from other students around the
          country — all while climbing a leaderboard from their district to the national board.
        </p>

        <div className="rule mt-12" />

        {/* The idea */}
        <section className="mt-12 space-y-5 text-[15px] leading-relaxed text-ghost max-w-2xl">
          <h2 className="font-mono text-[13px] uppercase tracking-label text-ash">The idea</h2>
          <p>
            Notes already move around every South African school — traded in WhatsApp groups, photographed at
            break, or lost when the year ends. EduRank gives that exchange one proper home: searchable,
            quality-checked, and fair to the people who put the work in.
          </p>
          <p>
            If you make good notes, you should be recognised for it. So the person who uploads a note earns
            points every time it is approved, downloaded or upvoted. And if you need help, you spend points
            you earned — not money — to unlock the material you need.
          </p>
          <p>
            It is built to be <span className="text-ash">free for students, always</span>. EduRank is not a
            shop and points are not a currency you buy — they are earned by taking part.
          </p>
        </section>

        <div className="rule mt-12" />

        {/* How it works */}
        <section className="mt-12">
          <h2 className="font-mono text-[13px] uppercase tracking-label text-ash mb-6">How to use it</h2>
          <ol className="space-y-5">
            <Step
              n="01"
              title="Create a free account"
              body="Sign up with an email and a player name. No payment details, ever."
            />
            <Step
              n="02"
              title="Set your grade and pick your school"
              body="Your grade locks for the school year and unlocks the notes for it. Pin your school on the map so you can rep it on the leaderboard."
            />
            <Step
              n="03"
              title="Upload your notes"
              body="Drop a PDF, summary or set of answers. Every upload is reviewed by AI moderation and our team, and every file is fingerprinted so your ownership is on record."
            />
            <Step
              n="04"
              title="Earn points"
              body="Approved notes earn PTS instantly — plus more when people download, upvote and refer friends. Daily streaks and challenges add to it."
            />
            <Step
              n="05"
              title="Unlock what you need"
              body="Spend your PTS to open other students' notes. Free notes cost nothing at all; premium ones cost points you earned."
            />
            <Step
              n="06"
              title="Climb the board"
              body="Your points feed your school, your district and the national board. Watch your rank rise from the bottom to the top."
            />
          </ol>
        </section>

        <div className="rule mt-12" />

        {/* What you get */}
        <section className="mt-12">
          <h2 className="font-mono text-[13px] uppercase tracking-label text-ash mb-6">What EduRank offers</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card icon={<BookOpen className="w-5 h-5 text-ash" />} title="A free notes library" body="Original CAPS-aligned study notes for grades 11–12, written by the EduRank team — free to read, no sign-up." />
            <Card icon={<Upload className="w-5 h-5 text-ash" />} title="A notes marketplace" body="Hundreds of student notes across subjects, searchable by grade, subject and topic." />
            <Card icon={<Trophy className="w-5 h-5 text-ash" />} title="Leaderboards & streaks" body="Compete per school, per district and nationally. Daily challenges and login streaks keep the grind going." />
            <Card icon={<MapPin className="w-5 h-5 text-ash" />} title="A map of schools" body="Find your school, see who reps it, and browse notes from schools across South Africa." />
            <Card icon={<ShieldCheck className="w-5 h-5 text-ash" />} title="Quality you can trust" body="AI moderation, human review and teacher verification keep low-quality and copied notes off the board." />
            <Card icon={<Sparkles className="w-5 h-5 text-ash" />} title="Proof of authorship" body="Every upload gets a provenance fingerprint and a shareable certificate as proof you authored it first." />
            <Card icon={<Users className="w-5 h-5 text-ash" />} title="A real community" body="Report content, suggest improvements and vote on what EduRank builds next." />
            <Card icon={<GraduationCap className="w-5 h-5 text-ash" />} title="Skills for the real world" body="Earning, saving and spending points teaches how an economy actually works — safely, with nothing at stake." />
          </div>
        </section>

        <div className="rule mt-12" />

        <section className="mt-12 max-w-2xl space-y-4 text-[15px] leading-relaxed text-ghost">
          <h2 className="font-mono text-[13px] uppercase tracking-label text-ash">Free, and it stays free</h2>
          <p>
            EduRank does not ask students for money. You earn points by contributing and spend them on study
            material. Rewards and perks are funded by partners who support the mission — never by charging
            learners for access.
          </p>
          <p>
            Read more about where we are going on our{" "}
            <Link href="/mission" className="text-accent no-underline hover:underline">
              mission page
            </Link>
            .
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/study" className="btn-solid">
            Browse free notes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link href="/register" className="btn-mark">
            Join the ranks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-dim text-[12px] mt-12 leading-relaxed">
          Uploaded PDFs are compressed in your browser using{" "}
          <a href="https://www.ghostscript.com" className="text-ghost no-underline hover:text-ash" target="_blank" rel="noreferrer">
            Ghostscript
          </a>{" "}
          (AGPL-3.0), compiled to WebAssembly. Maps use OpenFreeMap and OpenStreetMap data.
        </p>
        <p className="text-mute text-[13px] mt-4">
          Questions or feedback? Email{" "}
          <a href="mailto:studyedurank@gmail.com" className="text-ash no-underline hover:underline">
            studyedurank@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span className="font-mono text-[12px] text-accent shrink-0 w-6 pt-0.5">{n}</span>
      <span>
        <span className="block font-medium text-ash">{title}</span>
        <span className="block text-ghost text-[14px] mt-0.5 leading-relaxed">{body}</span>
      </span>
    </li>
  );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="panel p-5">
      <div className="mb-3">{icon}</div>
      <div className="font-medium text-ash">{title}</div>
      <p className="text-ghost text-[13px] mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
