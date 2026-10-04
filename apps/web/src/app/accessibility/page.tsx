import { LegalPage, Section } from "@/components/legal-page";

export const metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility Statement">
      <Section title="1. Our commitment">
        <p>
          EduRank aims to meet the Web Content Accessibility Guidelines (WCAG) 2.2 level AA. Education
          should not have barriers, and neither should this platform.
        </p>
      </Section>

      <Section title="2. What we've done">
        <p>
          Semantic HTML and headings, a visible keyboard focus ring, labelled form fields, colour contrast
          checked against the dark theme, reduced-motion support for animations, and text alternatives for
          images and icons.
        </p>
      </Section>

      <Section title="3. Known limitations">
        <p>
          The interactive school map depends on WebGL and may be harder to use with some assistive tech; the
          school list beside it is a fully keyboard-accessible alternative. We are continuously improving
          keyboard and screen-reader support.
        </p>
      </Section>

      <Section title="4. Feedback">
        <p>
          If you hit an accessibility barrier, tell us at{" "}
          <a href="mailto:questions@edurank.co.za" className="text-ash no-underline hover:underline">questions@edurank.co.za</a>{" "}
          and describe the page and what went wrong. We aim to respond within a few days.
        </p>
      </Section>
    </LegalPage>
  );
}
