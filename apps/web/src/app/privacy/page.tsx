import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — EduRank",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-night text-ash">
      <div className="max-w-[760px] mx-auto px-6 py-16">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-label text-ghost no-underline hover:text-ash">
          ← Back to EduRank
        </Link>
        <h1 className="font-serif text-4xl font-medium tracking-tight mt-6 mb-3">Privacy Policy</h1>
        <p className="label mb-10">Effective 2026 · How EduRank handles your information.</p>

        <div className="space-y-8">
          <Section title="1. What we collect">
            <p>When you create an account we collect your email address, display name, and optional grade and school. When you use the platform we collect the notes you upload, your points activity, and basic usage data needed to run leaderboards, streaks and challenges.</p>
          </Section>

          <Section title="2. How we use it">
            <p>We use your information to operate the platform: to create and secure your account, personalise the notes you see, run rankings and streaks, award points, prevent abuse, and communicate important account messages (for example email verification and password resets, which you may only receive from us).</p>
          </Section>

          <Section title="3. Email">
            <p>We send transactional email only — account verification and password reset. We do not send marketing email unless you separately opt in, and we never sell your email address.</p>
          </Section>

          <Section title="4. What we don't do">
            <p>We do not sell your personal data. We do not use your email for third-party advertising. We do not associate your activity with advertising profiles.</p>
          </Section>

          <Section title="5. Sharing">
            <p>We do not share your personal information with third parties except with service providers that help us run the platform (for example our hosting provider), where required by law, or to protect the rights and safety of EduRank and its users.</p>
          </Section>

          <Section title="6. Your data & your rights">
            <p>You can update your profile details at any time. You can request access to, correction of, or deletion of your personal data. Because your notes and points history are part of the platform, deleting your account removes the personal data we hold about you (uploaded content may remain to the extent governed by our Terms of Service).</p>
          </Section>

          <Section title="7. Security">
            <p>We store passwords as salted hashes and session tokens as hashes. Access to your account data is limited to what the platform needs to function. No method of transmission is 100% secure, but we take reasonable measures to protect your information.</p>
          </Section>

          <Section title="8. Children">
            <p>EduRank is intended for users aged 13 and over. We do not knowingly collect personal data from children under 13. If you believe a child has provided us personal data, contact us and we will remove it.</p>
          </Section>

          <Section title="9. Changes">
            <p>We may update this policy. If we make material changes we will notify you. Continued use means you accept the updated policy.</p>
          </Section>

          <Section title="10. Contact">
            <p>For any privacy question or request, contact us through the address listed on our About page.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-mono text-[13px] uppercase tracking-label text-ash mb-2">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-ghost">{children}</div>
    </section>
  );
}
