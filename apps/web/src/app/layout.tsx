import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/store";
import { AsciiBackdrop } from "@/components/ascii-backdrop";

export const metadata: Metadata = {
  title: "EduRank — Climb the ranks.",
  description:
    "The study notes arena for the kids school gave up on. Upload notes, earn PTS, unlock the best study packs and climb the national board.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="night">
      <body className="bg-night text-ash font-sans antialiased">
        <AsciiBackdrop />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}