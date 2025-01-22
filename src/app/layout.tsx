import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";
import { GDPRConsent } from "@/components/gdpr-consent";

export const metadata: Metadata = {
  title: "Anime Guessr - Daily Anime Challenge",
  description: "Test your anime knowledge with daily clips!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased flex flex-col">
        {children}
        <Footer />
        <GDPRConsent />
      </body>
    </html>
  );
}
