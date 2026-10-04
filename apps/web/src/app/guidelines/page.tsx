import { LegalPage, Section } from "@/components/legal-page";

export const metadata = { title: "Community Guidelines" };

export default function GuidelinesPage() {
  return (
    <LegalPage title="Community Guidelines">
      <Section title="1. Who this is for">
        <p>
          EduRank is for South African high-school students (grades 8–12), and for the teachers and
          principals who support them. Be decent to each other. You are responsible for what you post.
        </p>
      </Section>

      <Section title="2. What you may upload">
        <p>
          Notes, summaries, worked examples, flashcards and study guides <b>that you made or have the
          right to share</b>. Keep it aligned to your subject and grade.
        </p>
      </Section>

      <Section title="3. What you may not upload">
        <p>
          Exam papers, memoranda, marking guidelines or any leaked assessment material; other people&rsquo;s
          work copied from the internet, another school or another student; personal information about
          anyone else; harassment, hate speech, or anything sexual, violent or unlawful; advertising or
          spam; and anything you don&rsquo;t have permission to share.
        </p>
      </Section>

      <Section title="4. School and grade rules">
        <p>
          Your grade and school are locked for the year. Do not create accounts to get around the grade
          or school lock, to farm points, or to manipulate the leaderboard. Referral bonuses are capped and
          abuse is reversed.
        </p>
      </Section>

      <Section title="5. Under 18?">
        <p>
          You may use EduRank from age 13. Do not share your home address, phone number, or other
          personal details in a note, a bio or a comment. If you are under 18 and someone asks for your
          personal information, report it.
        </p>
      </Section>

      <Section title="6. Reporting and consequences">
        <p>
          Every note has a &ldquo;Report stolen&rdquo; action, and you can email{" "}
          <a href="mailto:jacquesdup90@gmail.com" className="text-ash no-underline hover:underline">jacquesdup90@gmail.com</a>.
          Breaking these rules can get content removed, points reversed, or your account suspended.
          Serious cases may be reported to your school or the authorities.
        </p>
      </Section>
    </LegalPage>
  );
}
