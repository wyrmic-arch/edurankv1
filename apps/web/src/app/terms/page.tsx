import { LegalPage, Section } from "@/components/legal-page";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <Section title="1. Who we are">
        <p>
          EduRank (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a platform where South African students share and
          access study notes, summaries and study material for grades 8–12. By creating an account or using
          EduRank you agree to these terms and to our{" "}
          <a href="/privacy" className="text-ash no-underline hover:underline">Privacy Policy</a>.
        </p>
      </Section>

      <Section title="2. Your account">
        <p>
          You must be at least 13 years old to use EduRank. You are responsible for keeping your password
          secure and for all activity under your account. Provide accurate information and keep it up to
          date. Your grade and school are locked for the academic year once set.
        </p>
      </Section>

      <Section title="3. Content you upload">
        <p>
          You retain ownership of the notes and material you upload. By uploading, you grant EduRank a
          non-exclusive licence to host, display and distribute that content on the platform and to let
          other users access it as permitted by your settings.
        </p>
        <p>
          You choose a licence when you upload (default: all rights reserved). Unless you choose a Creative
          Commons licence, your notes are licensed for on-platform access only — reselling, redistributing or
          republishing them elsewhere is not allowed. Every upload is fingerprinted (SHA-256) and you can
          share the resulting provenance certificate as proof you authored it first.
        </p>
        <p>
          You promise the content you upload is yours or you have permission to share it, and that it does
          not infringe anyone&rsquo;s copyright. Do not upload exam papers, memoranda, leaked assessment
          material, other people&rsquo;s personal information, harmful material, or anything unlawful. See
          the <a href="/guidelines" className="text-ash no-underline hover:underline">Community Guidelines</a>{" "}
          and <a href="/copyright" className="text-ash no-underline hover:underline">Copyright & Takedown</a> policy.
        </p>
      </Section>

      <Section title="4. The points economy">
        <p>
          PTS are an in-platform currency used to access premium notes and cosmetic items. PTS have no cash
          value, are not redeemable for money, are non-refundable, and may be adjusted or withdrawn if we
          detect abuse, fraud or platform manipulation. Where we offer rewards (such as airtime or data),
          additional terms apply and stock may be limited.
        </p>
      </Section>

      <Section title="5. Acceptable use">
        <p>
          You agree not to abuse the platform: no spam, no scraping, no attempts to gain unauthorised
          access, no reselling of access, no interfering with other users or the integrity of leaderboards
          and rankings, and no uploading content that is unlawful or harmful.
        </p>
      </Section>

      <Section title="6. Intellectual property">
        <p>
          EduRank&rsquo;s branding, design and platform code are owned by EduRank. Your content remains
          yours. We respond to copyright complaints as described in our Copyright & Takedown policy.
        </p>
      </Section>

      <Section title="7. Termination">
        <p>
          We may suspend or terminate accounts that breach these terms, and remove content that breaks
          them. You may stop using EduRank at any time and request deletion of your account and personal
          information.
        </p>
      </Section>

      <Section title="8. Disclaimer & liability">
        <p>
          EduRank is provided &ldquo;as is&rdquo;. Study material is user-generated; we do not guarantee its
          accuracy or completeness and it does not replace your school&rsquo;s official curriculum or
          guidance. To the fullest extent permitted by law, our liability for any claim is limited to the
          amount you paid us in the preceding 12 months (which is currently nothing).
        </p>
      </Section>

      <Section title="9. Governing law">
        <p>
          These terms are governed by the laws of the Republic of South Africa, and you agree to the
          jurisdiction of the South African courts. If any part of these terms is unenforceable, the rest
          stays in force. These terms do not limit any rights you have under the Consumer Protection Act or
          any other law that cannot be waived.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Questions about these terms? Email{" "}
          <a href="mailto:jacquesdup90@gmail.com" className="text-ash no-underline hover:underline">jacquesdup90@gmail.com</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
