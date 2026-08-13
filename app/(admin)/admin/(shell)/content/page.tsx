import type { Metadata } from "next";
import { Newspaper, Camera, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Content" };

/**
 * PLACEHOLDER shell. The full content architecture (editorial articles,
 * homepage blocks, promotions, and the Instagram content inbox) is
 * scoped for a later phase — this proves the navigation slot exists.
 */
export default function AdminContentPage() {
  return (
    <div>
      <PageHeader title="Content" description="Reserved for the Content Management phase." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: Newspaper, title: "Articles", body: "Editorial / blog content management." },
          { icon: Camera, title: "Social Inbox", body: "Review and classify ingested Instagram content." },
          { icon: Megaphone, title: "Promotions", body: "Time-boxed campaigns and homepage banners." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="border border-dashed border-border bg-surface p-6">
            <Icon className="mb-4 text-muted" size={22} aria-hidden />
            <h2 className="font-display text-headline-sm text-ink">{title}</h2>
            <p className="mt-2 font-body text-[13px] text-muted">{body}</p>
            <p className="mt-4 font-body text-[11px] uppercase tracking-[0.08em] text-muted-2">
              Not implemented yet
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
