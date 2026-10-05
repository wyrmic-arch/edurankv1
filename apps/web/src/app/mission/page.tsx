import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Coins,
  Flag,
  Globe,
  Heart,
  Lock,
  Rocket,
  Scale,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Mission",
  description:
    "EduRank's mission: make the best study material in South Africa findable, free to reach and fairly rewarded — and teach young people how an economy works while they use it.",
  alternates: { canonical: "/mission" },
};

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-night text-ash">
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-label text-ghost no-underline hover:text-ash">
          ← Back to EduRank
        </Link>

        <div className="label mt-8 mb-2 inline-flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-accent" /> MISSION
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight leading-tight">
          Why EduRank exists.
        </h1>

        <p className="font-serif text-2xl sm:text-3xl text-ash leading-snug mt-8 max-w-2xl">
          To make the best study material in South Africa findable, free to reach and fairly rewarded — and to
          teach young people how an economy actually works while they use it.
        </p>

        <div className="rule mt-12" />

        {/* The problem */}
        <section className="mt-12 max-w-2xl space-y-4 text-[15px] leading-relaxed text-ghost">
          <h2 className="font-mono text-[13px] uppercase tracking-label text-ash">The problem we&rsquo;re solving</h2>
          <p>
            Good study material already exists in every school — but it is scattered, unevenly shared and often
            lost. It moves through WhatsApp groups and at break time, and it depends on who you happen to know.
          </p>
          <p>
            The students who put in the work to make great notes usually get nothing for it. And the students
            who need help the most are the least likely to have access to it.
          </p>
          <p>
            On top of that, most young people leave school having never practised earning, saving, pricing or
            spending — the basics of how money works.
          </p>
        </section>

        <div className="rule mt-12" />

        {/* What we're building */}
        <section className="mt-12 max-w-2xl space-y-4 text-[15px] leading-relaxed text-ghost">
          <h2 className="font-mono text-[13px] uppercase tracking-label text-ash">What we&rsquo;re building</h2>
          <p>
            A free student knowledge economy. You earn points by contributing — uploading notes, helping others,
            keeping your streak — and you spend those points on the material you need. Nobody has to pay to take
            part.
          </p>
          <p>
            Along the way, the points economy acts as a safe sandbox for the real thing: you learn what it means
            to earn, to save toward a goal, to price your own work and to spend wisely. That is the mission
            behind every feature, not an afterthought.
          </p>
          <p>
            EduRank is funded by partners and schools who believe in that mission — so students never carry the
            cost.
          </p>
        </section>

        <div className="rule mt-12" />

        {/* What you can expect */}
        <section className="mt-12">
          <h2 className="font-mono text-[13px] uppercase tracking-label text-ash mb-6">What you can expect from us</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card icon={<Heart className="w-5 h-5 text-accent" />} title="Always free for students" body="No paywalls on learning and no forced spending. Everything you need is earned by participating." />
            <Card icon={<Scale className="w-5 h-5 text-ash" />} title="Fair play" body="Rank cannot be bought. Points come from contributing, not from paying, so the board means something." />
            <Card icon={<ShieldCheck className="w-5 h-5 text-ash" />} title="Quality and safety" body="AI moderation, human review and teacher verification, plus reporting tools to keep the community clean." />
            <Card icon={<Lock className="w-5 h-5 text-ash" />} title="Your work stays yours" body="You own what you upload. Every file is fingerprinted so authorship can be proven, and you choose its licence." />
            <Card icon={<Users className="w-5 h-5 text-ash" />} title="A voice in the build" body="Suggest ideas, vote on the roadmap and report what is broken. EduRank is built with its students." />
            <Card icon={<Coins className="w-5 h-5 text-ash" />} title="Real rewards, honestly earned" body="Where we offer rewards, they are funded by partners and given for genuine contribution — never a trap." />
          </div>
        </section>

        <div className="rule mt-12" />

        {/* Goals */}
        <section className="mt-12">
          <h2 className="font-mono text-[13px] uppercase tracking-label text-ash mb-6">Where we&rsquo;re going</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <GoalPanel
              icon={<Compass className="w-4 h-4 text-accent" />}
              period="Short term · next 6–12 months"
              goals={[
                "Grow the free CAPS-aligned notes library across more grades and subjects.",
                "Welcome our first thousands of students and schools onto the platform.",
                "Launch partner-funded rewards so top contributors earn real airtime and data.",
                "Ship financial-literacy badges that reward earning, saving and giving back.",
                "Bring teachers and principals in with tools that help their schools.",
              ]}
            />
            <GoalPanel
              icon={<Globe className="w-4 h-4 text-accent" />}
              period="Long term · 2–5 years"
              goals={[
                "Become South Africa's largest student knowledge economy.",
                "Pay creators fairly for the material they put into the world.",
                "Put a practical financial-literacy programme into schools nationwide.",
                "Open a tutoring marketplace and an opportunities board for bursaries and first jobs.",
                "Take the model to students across the continent.",
              ]}
            />
          </div>
        </section>

        <div className="rule mt-12" />

        {/* Non-negotiables */}
        <section className="mt-12 max-w-2xl">
          <h2 className="font-mono text-[13px] uppercase tracking-label text-ash mb-6 inline-flex items-center gap-2">
            <Flag className="w-3.5 h-3.5 text-accent" /> What we won&rsquo;t do
          </h2>
          <ul className="space-y-3 text-[15px] text-ghost leading-relaxed">
            <Principle>We won&rsquo;t put learning behind a paywall or force students to spend money.</Principle>
            <Principle>We won&rsquo;t let rank be bought — points are earned, never purchased into the top.</Principle>
            <Principle>We won&rsquo;t sell your personal information or your work.</Principle>
            <Principle>We won&rsquo;t reward copied or leaked material — original work only.</Principle>
          </ul>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/register" className="btn-mark">
            Join the mission <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link href="/study" className="btn-ghost">
            <BookOpen className="w-3.5 h-3.5" /> Browse free notes
          </Link>
        </div>

        <p className="text-mute text-[13px] mt-12">
          Want to support EduRank, sponsor a reward pool or partner with us?{" "}
          <a href="mailto:studyedurank@gmail.com" className="text-ash no-underline hover:underline">
            studyedurank@gmail.com
          </a>
        </p>
      </div>
    </div>
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

function GoalPanel({
  icon,
  period,
  goals,
}: {
  icon: React.ReactNode;
  period: string;
  goals: string[];
}) {
  return (
    <div className="panel p-6">
      <div className="label !text-[10px] inline-flex items-center gap-2 mb-4">
        {icon} {period}
      </div>
      <ul className="space-y-3">
        {goals.map((g) => (
          <li key={g} className="flex gap-3 text-[14px] text-ghost leading-relaxed">
            <Rocket className="w-3.5 h-3.5 text-dim shrink-0 mt-1" />
            <span>{g}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Principle({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="text-accent shrink-0">—</span>
      <span>{children}</span>
    </li>
  );
}
