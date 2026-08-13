import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { Input, Label } from "@/components/ui/input";

export const metadata: Metadata = { title: "Settings" };

/** PLACEHOLDER shell — Users/Roles/Settings has no backend yet. */
export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Users, roles, and general configuration — visual shell only." />
      <div className="max-w-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-headline-sm text-ink">General</h2>
        <div className="mt-6 flex flex-col gap-5">
          <div>
            <Label htmlFor="site-name">Site Name</Label>
            <Input id="site-name" defaultValue="Perkasa Motors" disabled />
          </div>
          <div>
            <Label htmlFor="site-email">Contact Email</Label>
            <Input id="site-email" defaultValue="sales@perkasamotors.com" disabled />
          </div>
        </div>
        <p className="mt-6 border-t border-border pt-4 font-body text-[12px] text-muted-2">
          Not implemented — user/role management arrives with Supabase Auth
          in a later phase.
        </p>
      </div>
    </div>
  );
}
