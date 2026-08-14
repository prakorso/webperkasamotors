import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { getWebsiteSettings } from "@/lib/data/site-settings";

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

// Falls back to the live Netlify URL (not localhost) so production metadata
// is correct even if NEXT_PUBLIC_SITE_URL isn't set in the deploy environment.
// Update this fallback — and set the env var in Netlify — if a custom domain
// is adopted later.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webperkasamotors.netlify.app";

/**
 * PHASE 2C: title/description/OG/favicon are database-driven (Website
 * Settings General screen, via lib/data/site-settings.ts). Converted from
 * a static `metadata` export to `generateMetadata` for this reason — the
 * strings below only appear in code as getWebsiteSettings()'s own
 * SAFE_DEFAULTS fallback, so a missing/unreachable settings row still
 * produces this exact output, not broken metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWebsiteSettings();
  const title = settings.seoTitle ?? `${settings.companyName} — Premium Automotive Showroom`;
  const description = settings.seoDescription ?? undefined;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s — ${settings.companyName}`,
    },
    description,
    openGraph: {
      type: "website",
      siteName: settings.companyName,
      title,
      description,
      images: settings.seoOgImageUrl ? [settings.seoOgImageUrl] : undefined,
    },
    // Falls back to the static app/icon.svg file convention when no
    // favicon has been uploaded through Website Settings.
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

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
