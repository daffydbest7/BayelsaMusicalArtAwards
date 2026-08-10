import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { AuthRecoveryRedirect } from "@/components/auth/AuthRecoveryRedirect";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "BMAA 2026 | Bayelsa Musical Artiste Awards",
  description: "Beyond the Plains | Celebrate Bayelsa's music scene. Official voting and entry platform for BMAA 2026.",
  keywords: ["BMAA", "Bayelsa Musical Artiste Awards", "2026", "Beyond the Plains", "Bayelsa music", "voting"],
  openGraph: {
    title: "BMAA 2026 | Beyond the Plains",
    description: "Official voting and entry platform for the Bayelsa Musical Artiste Awards 2026.",
    siteName: "BMAA 2026",
    type: "website",
    locale: "en_NG",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://bmaa2026.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "BMAA 2026 | Beyond the Plains",
    description: "Official voting and entry platform for the Bayelsa Musical Artiste Awards 2026.",
  },
  icons: {
    icon: "/bmaa-logo.jpeg",
    shortcut: "/bmaa-logo.jpeg",
    apple: "/bmaa-logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthRecoveryRedirect />
        {children}
      </body>
    </html>
  );
}

