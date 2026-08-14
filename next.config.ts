import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
