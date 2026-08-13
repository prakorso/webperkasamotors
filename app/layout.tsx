import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Perkasa Motors — Premium Automotive Showroom",
    template: "%s — Perkasa Motors",
  },
  description:
    "Perkasa Motors is a curated premium automotive showroom — precision, performance, and Perkasa.",
  openGraph: {
    type: "website",
    siteName: "Perkasa Motors",
    title: "Perkasa Motors — Premium Automotive Showroom",
    description:
      "Perkasa Motors is a curated premium automotive showroom — precision, performance, and Perkasa.",
  },
  // Favicon is handled automatically via the app/icon.svg file convention.
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink font-body">
        {children}
      </body>
    </html>
  );
}
