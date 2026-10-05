import { LegalPage, Section } from "@/components/legal-page";

export const metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <LegalPage title="Security">
      <Section title="1. Report a vulnerability">
        <p>
          Found a security issue? Please email{" "}
          <a href="mailto:studyedurank@gmail.com" className="text-ash no-underline hover:underline">studyedurank@gmail.com</a>{" "}
          with steps to reproduce. Give us a reasonable chance to fix it before disclosing it publicly. We
          will not pursue legal action against researchers who act in good faith and do not access, modify
          or exfiltrate other people&rsquo;s data.
        </p>
      </Section>

      <Section title="2. How we protect accounts">
        <p>
          Passwords are stored as salted PBKDF2-SHA256 hashes — never in plain text. Sessions use opaque
          high-entropy tokens stored only as hashes. All traffic is served over HTTPS. Access to data is
          limited to what each role needs.
        </p>
      </Section>

      <Section title="3. Reporting abuse">
        <p>
          For spam, stolen notes or abusive accounts, use the in-app <b>Report</b> action or email{" "}
          <a href="mailto:studyedurank@gmail.com" className="text-ash no-underline hover:underline">studyedurank@gmail.com</a>.
        </p>
      </Section>

      <Section title="4. No bug bounty">
        <p>
          We do not currently offer a paid bug bounty. We do appreciate responsible disclosure and will
          credit reporters who ask to be credited.
        </p>
      </Section>
    </LegalPage>
  );
}
