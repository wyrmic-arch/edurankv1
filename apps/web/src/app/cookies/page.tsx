import { LegalPage, Section } from "@/components/legal-page";

export const metadata = { title: "Cookies & Local Storage" };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies & Local Storage">
      <Section title="1. The short version">
        <p>
          EduRank does not use advertising or third-party tracking cookies. We store a single session
          token in your browser&rsquo;s local storage so you stay logged in. We do not run Google
          Analytics or advertising pixels.
        </p>
      </Section>

      <Section title="2. What we store in your browser">
        <p>
          <b>Session token (local storage, key <code>edurank_token</code>):</b> an opaque token that keeps
          you signed in. It is sent only to our API. Clearing it or logging out removes it.
        </p>
        <p>
          <b>Strictly necessary cookies:</b> our API may set an httpOnly session cookie for same-site
          requests. It is used only to authenticate you and is never shared.
        </p>
      </Section>

      <Section title="3. Third parties">
        <p>
          Pages you load may embed a map. The school map loads map tiles and fonts from OpenFreeMap and can
          embed an OpenStreetMap frame; those providers may see your IP address and browser as part of
          serving the map. We do not send them your identity.
        </p>
        <p>
          Images on subject and school pages may come from Unsplash and are cached by us; the source
          request is made by our server, not your browser.
        </p>
      </Section>

      <Section title="4. If this changes">
        <p>
          If we ever add analytics or other non-essential cookies, we will ask for your consent first and
          update this page. You can clear the data we store at any time through your browser settings.
        </p>
      </Section>
    </LegalPage>
  );
}
