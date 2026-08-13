import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local, self-generated placeholder SVGs only (lib/mock imagery) —
    // safe to allow here since nothing user-uploaded reaches this path yet.
    // Revisit once real (remote) vehicle photography is wired in Phase 2/3.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
