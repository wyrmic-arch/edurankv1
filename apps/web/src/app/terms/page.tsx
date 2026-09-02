import Link from "next/link";

export const metadata = {
  title: "Terms of Service — EduRank",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-night text-ash">
      <div className="max-w-[760px] mx-auto px-6 py-16">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-label text-ghost no-underline hover:text-ash">
          ← Back to EduRank
        </Link>
        <h1 className="font-serif text-4xl font-medium tracking-tight mt-6 mb-3">Terms of Service</h1>
        <p className="label mb-10">Effective 2026 · Please read before you use EduRank.</p>

        <div className="space-y-8">
          <Section title="1. Who we are">
            <p>EduRank (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a platform where students share and access study notes, summaries and past exam material for South African grades 8–12.</p>
          </Section>

          <Section title="2. Your account">
            <p>You must be at least 13 years old to use EduRank. You are responsible for keeping your password secure and for all activity under your account. Provide accurate information and keep it up to date.</p>
          </Section>

          <Section title="3. Content you upload">
            <p>You retain ownership of the notes and material you upload. By uploading, you grant EduRank a non-exclusive licence to host, display and distribute that content on the platform, and to allow other users to access it as permitted by your chosen settings.</p>
            <p>You promise the content you upload is yours or you have permission to share it, and that it does not infringe anyone&rsquo;s copyright. Do not upload content containing personal information of others, harmful material, or anything unlawful.</p>
          </Section>

          <Section title="4. The points economy">
            <p>PTS are an in-platform currency used to access premium notes and cosmetic items. PTS have no cash value, are not redeemable for money, and may be adjusted or withdrawn if we detect abuse, fraud or platform manipulation.</p>
          </Section>

          <Section title="5. Acceptable use">
            <p>You agree not to abuse the platform: no spam, no scraping, no attempts to gain unauthorised access, no reselling of access, no interfering with other users or the integrity of leaderboards and rankings, and no uploading content that is unlawful or harmful.</p>
          </Section>

          <Section title="6. Intellectual property">
            <p>EduRank&rsquo;s branding, design and platform code are owned by EduRank. Your content remains yours.</p>
          </Section>

          <Section title="7. Termination">
            <p>We may suspend or terminate accounts that breach these terms. You may delete your account at any time.</p>
          </Section>

          <Section title="8. Disclaimer & liability">
            <p>EduRank is provided &ldquo;as is&rdquo;. Study material is user-generated; we do not guarantee accuracy or completeness, and it does not replace official curriculum advice. To the fullest extent permitted by law, our liability for any claim is limited to the amount you paid us in the preceding 12 months (which is currently nothing).</p>
          </Section>

          <Section title="9. Changes">
            <p>We may update these terms from time to time. Continued use after changes means you accept the updated terms.</p>
          </Section>

          <Section title="10. Contact">
            <p>Questions about these terms? Contact us through the address listed on our About page.</p>
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
