import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles",
  description: "Perkasa Motors editorial content.",
};

/**
 * PLACEHOLDER — proves the route exists in the information architecture.
 * content_articles is intentionally out of scope for Phase 1 (deferred to
 * the Content phase per the architecture blueprint); no mock articles
 * were invented to fill this page.
 */
export default function ArticlesPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-24 text-center md:px-8 lg:px-margin">
      <p className="mb-4 font-body text-label uppercase tracking-[0.1em] text-primary">
        Coming Soon
      </p>
      <h1 className="mx-auto max-w-xl font-display text-headline-lg text-ink">
        Editorial content is on its way.
      </h1>
      <p className="mx-auto mt-4 max-w-md font-body text-body text-muted">
        This route is reserved for the Content Management phase — nothing
        is wired here yet.
      </p>
    </div>
  );
}
