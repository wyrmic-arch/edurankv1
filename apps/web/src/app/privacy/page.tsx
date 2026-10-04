import { LegalPage, Section } from "@/components/legal-page";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <Section title="1. Who we are">
        <p>
          EduRank is a study-notes platform for South African students (grades 8–12). For the purposes of
          the Protection of Personal Information Act 4 of 2013 (&ldquo;POPIA&rdquo;), EduRank is the
          responsible party for the personal information described here.
        </p>
        <p>
          <b>Information Officer:</b> Jacques du Plessis ·{" "}
          <a href="mailto:jacquesdup90@gmail.com" className="text-ash no-underline hover:underline">jacquesdup90@gmail.com</a>
        </p>
      </Section>

      <Section title="2. What we collect">
        <p>
          When you create an account: your email address, display name, and optional grade and school. When
          you use the platform: the notes you upload, your points activity, and basic technical/usage data
          needed to run accounts, rankings, streaks, challenges and abuse prevention.
        </p>
      </Section>

      <Section title="3. Why we process it (lawful basis)">
        <p>
          We process your information to perform our contract with you (running your account and the
          platform), for our legitimate interests (security, fraud and abuse prevention, and improving the
          service), and to comply with legal obligations. Where we rely on consent (for example an optional
          email digest) you can withdraw it at any time.
        </p>
      </Section>

      <Section title="4. Email">
        <p>
          We send transactional email (account verification, password reset, and notifications you have
          enabled). You can switch the daily email digest off in your profile at any time, and we never sell
          your email address.
        </p>
      </Section>

      <Section title="5. Sharing">
        <p>
          We share personal information only with service providers that help us run the platform (for
          example our hosting and email providers), where required by law, or to protect the rights and
          safety of EduRank and its users. We do not sell your personal data or use it for third-party
          advertising.
        </p>
      </Section>

      <Section title="6. Cross-border transfers">
        <p>
          Our infrastructure may process data outside South Africa (for example on Cloudflare&rsquo;s global
          network). Where information is transferred across borders we take steps to ensure it receives a
          comparable level of protection, as POPIA requires.
        </p>
      </Section>

      <Section title="7. Retention">
        <p>
          We keep personal information for as long as your account is active and as needed to run the
          platform. Account and security records are kept no longer than necessary. Records we must keep for
          legal, tax or accounting reasons are retained for the periods the law requires (generally up to
          five years), then securely destroyed.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>
          Under POPIA you may ask us to access, correct or delete your personal information, object to
          processing, and withdraw consent. Email{" "}
          <a href="mailto:jacquesdup90@gmail.com" className="text-ash no-underline hover:underline">jacquesdup90@gmail.com</a>{" "}
          to make a request; we may need to verify your identity first. If you are not satisfied, you may
          complain to the Information Regulator (South Africa) at{" "}
          <a href="https://inforegulator.org.za" className="text-ash no-underline hover:underline">inforegulator.org.za</a>.
        </p>
      </Section>

      <Section title="9. Security">
        <p>
          We store passwords as salted hashes and session tokens as hashes, serve everything over HTTPS, and
          limit access to what each role needs. If a security compromise affects your personal information,
          we will notify you and the Information Regulator as POPIA requires. See our{" "}
          <a href="/security" className="text-ash no-underline hover:underline">Security page</a>.
        </p>
      </Section>

      <Section title="10. Cookies & local storage">
        <p>
          We store a session token in your browser and may set a strictly necessary cookie so you stay
          signed in. We do not use advertising or third-party tracking cookies. See our{" "}
          <a href="/cookies" className="text-ash no-underline hover:underline">Cookies page</a>.
        </p>
      </Section>

      <Section title="11. Children">
        <p>
          EduRank is intended for users aged 13 and over. Because many of our users are minors, we take
          extra care with their information and collect only what the platform needs. We do not knowingly
          collect personal data from children under 13. If you believe a child has given us personal data,
          contact us and we will remove it.
        </p>
      </Section>

      <Section title="12. Changes">
        <p>
          We may update this policy. If we make material changes we will notify you, and continued use means
          you accept the updated policy. The date at the top shows the latest version.
        </p>
      </Section>
    </LegalPage>
  );
}
