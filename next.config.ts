import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Post-release simplification R1/R1A: About, Pembiayaan and Kontak no longer
   * exist as pages; their content lives on the homepage, which is the single
   * canonical destination for those intents. The Owner confirmed the
   * simplified IA is final, so these are PERMANENT redirects (308, cached by
   * browsers and search engines). Sources are exact paths (no wildcard),
   * destinations never point back at a source (no loop), and Next preserves
   * any query string.
   */
  async redirects() {
    return [
      { source: "/about", destination: "/#tentang", permanent: true },
      { source: "/financing", destination: "/#pembayaran", permanent: true },
      { source: "/contact", destination: "/#kontak", permanent: true },
    ];
  },
  images: {
    // Local, self-generated placeholder SVGs only (lib/mock imagery) —
    // safe to allow here since nothing user-uploaded reaches this path.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // BATCH 3A: real vehicle photography now flows through Supabase
    // Storage (vehicle-media bucket) — next/image refuses any remote host
    // that isn't explicitly listed here, so without this every uploaded
    // photo would fail to render via <Image>. Scoped to this project's
    // exact hostname and the public object path, not a wildcard
    // *.supabase.co — update the hostname if the dedicated "Perkasa
    // Motors Website" project ever changes.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "itjytnbipxaflnaplwpd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
