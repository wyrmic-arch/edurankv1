import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/store";
import { SiteFooter } from "@/components/site-footer";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://edurank.co.za";
const DESCRIPTION =
  "South Africa's study notes arena for grades 8–12. Upload notes, earn PTS, unlock the best study packs and climb the national board.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EduRank — Climb the ranks.",
    template: "%s · EduRank",
  },
  description: DESCRIPTION,
  applicationName: "EduRank",
  keywords: ["study notes", "South Africa", "matric", "grade 12", "CAPS", "past papers", "leaderboard", "students"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "EduRank",
    title: "EduRank — Climb the ranks.",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_ZA",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "EduRank — South Africa's study notes arena" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduRank — Climb the ranks.",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="night">
      <body className="bg-night text-ash font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        <PresenceHeartbeat />
        <SiteFooter />
      </body>
    </html>
  );
}