import type { Metadata } from "next";
import Image from "next/image";
import { UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { getAllVehicleMediaForAdmin } from "@/lib/data/vehicles";

export const metadata: Metadata = { title: "Media" };

/**
 * PLACEHOLDER shell. Shows the media already attached to vehicles so the
 * grid/library layout is proven — uploading is not wired to Supabase
 * Storage yet (no bucket exists). Reads through lib/data like every other
 * screen; this used to import lib/mock directly, which was the one gap in
 * the data-access layer flagged by the Phase 2 audit.
 */
export default async function AdminMediaPage() {
  const media = await getAllVehicleMediaForAdmin();

  return (
    <div>
      <PageHeader title="Media Library" description="No Supabase Storage bucket exists yet — this reads mock imagery through lib/data." />

      <div className="mb-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border bg-surface p-10 text-center">
        <UploadCloud className="text-muted" size={28} aria-hidden />
        <p className="font-body text-[13px] text-muted">Drag files here or browse</p>
        <p className="font-body text-[11px] uppercase tracking-[0.08em] text-muted-2">
          Not implemented — no storage bucket connected
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {media.slice(0, 12).map((item) => (
          <div key={item.id} className="relative aspect-square overflow-hidden border border-border bg-surface-muted">
            <Image src={item.url} alt={item.altText} fill sizes="200px" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
