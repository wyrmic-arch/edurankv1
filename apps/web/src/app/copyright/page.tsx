import { LegalPage, Section } from "@/components/legal-page";

export const metadata = { title: "Copyright & Takedown" };

export default function CopyrightPage() {
  return (
    <LegalPage title="Copyright & Takedown">
      <Section title="1. You own what you make">
        <p>
          You keep the copyright in the notes you create and upload. Uploading does not transfer ownership.
          When you upload you choose a licence (all rights reserved by default) and you grant EduRank a
          non-exclusive licence to host, display and let other students access it on the platform.
        </p>
      </Section>

      <Section title="2. Provenance">
        <p>
          Every upload is fingerprinted with a SHA-256 hash at the moment it is uploaded, and you can share
          a public provenance certificate at <code>/verify/&lt;note-id&gt;</code> as timestamped proof that
          the file existed under your account first.
        </p>
      </Section>

      <Section title="3. Report stolen content">
        <p>
          If your work has been copied onto EduRank, open the note and use <b>Report stolen</b>, or email{" "}
          <a href="mailto:jacquesdup90@gmail.com" className="text-ash no-underline hover:underline">jacquesdup90@gmail.com</a>{" "}
          with: (a) the note link, (b) what is infringed, (c) proof you own it, and (d) your contact details.
        </p>
      </Section>

      <Section title="4. What we do">
        <p>
          We review reports, remove or restrict content that infringes copyright, and may suspend repeat
          infringers. If your content was removed and you believe it was a mistake, reply to the notice with
          a counter-notice and we will reassess.
        </p>
      </Section>

      <Section title="5. Things that are not allowed">
        <p>
          Uploading exam papers, memoranda or other leaked assessment material is prohibited regardless of
          who owns it. Do not upload someone else&rsquo;s notes or paid content, even with a citation.
        </p>
      </Section>
    </LegalPage>
  );
}
