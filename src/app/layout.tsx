import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
