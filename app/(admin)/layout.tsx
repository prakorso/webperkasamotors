import type { Metadata } from "next";

// Every /admin/* route is excluded from indexing — this is an internal
// console, not public content.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
