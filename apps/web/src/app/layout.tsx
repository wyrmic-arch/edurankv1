import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "EDURANK — Climb the ranks. Own the curve.",
  description:
    "South Africa's study notes arena. Upload notes, earn PTS, unlock the best study packs and climb the leaderboard from your district to the national board.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
