import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Post-release simplification R1: About, Pembiayaan and Kontak no longer
   * exist as pages; their content lives on the homepage, which is the single
   * canonical destination for those intents. Temporary (307) redirects for
   * now: switch to permanent once the Owner confirms the product decision
   * is final, because permanent redirects are cached by browsers and search
   * engines. Sources are exact paths (no wildcard), destinations never point
   * back at a source, so there is no loop.
   */
  async redirects() {
    return [
      { source: "/about", destination: "/#tentang", permanent: false },
      { source: "/financing", destination: "/#pembayaran", permanent: false },
      { source: "/contact", destination: "/#kontak", permanent: false },
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
