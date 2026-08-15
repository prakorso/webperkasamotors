"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SocialContent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { createContent, updateContent, deleteContent, type ContentInput } from "@/lib/actions/content";

const SELECT_CLASS =
  "h-11 w-full border border-border bg-surface px-3 font-body text-body text-ink focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-border bg-surface p-6">
      <legend className="px-2 font-body text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        {title}
      </legend>
      <div className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export interface VehicleOption {
  id: string;
  label: string;
}

interface ContentFormProps {
  content?: SocialContent;
  vehicleOptions: VehicleOption[];
}

/**
 * Real create/edit, backed by lib/actions/content.ts. Delete (visible only
 * when editing) really removes the row — see that action's own comment for
 * why content, unlike vehicles, doesn't route through a soft-archive state.
 */
export function ContentForm({ content, vehicleOptions }: ContentFormProps) {
  const router = useRouter();
  const isEdit = Boolean(content);

  const [form, setForm] = useState({
    vehicleId: content?.vehicleId ?? "",
    contentType: content?.contentType ?? "STOCK",
    status: content?.status ?? "INBOX",
    caption: content?.caption ?? "",
    permalink: content?.permalink ?? "",
    instagramMediaId: content?.instagramMediaId ?? "",
    postedAt: content?.postedAt ? content.postedAt.slice(0, 10) : "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: ContentInput = {
      vehicleId: form.vehicleId || null,
      contentType: form.contentType,
      status: form.status,
      caption: form.caption,
      permalink: form.permalink,
      instagramMediaId: form.instagramMediaId || null,
      postedAt: form.postedAt || null,
    };

    const result =
      isEdit && content ? await updateContent(content.id, input) : await createContent(input);

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    if (!isEdit && "id" in result && result.id) {
      router.push(`/admin/content/${result.id}`);
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!content) return;
    if (!confirm("Delete this content item? This cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    const result = await deleteContent(content.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/content");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Content">
        <div className="md:col-span-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            rows={3}
            value={form.caption}
            onChange={(e) => set("caption", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="permalink">Link</Label>
          <Input
            id="permalink"
            type="url"
            value={form.permalink}
            onChange={(e) => set("permalink", e.target.value)}
            placeholder="https://www.instagram.com/p/…"
            required
          />
        </div>
        <div>
          <Label htmlFor="contentType">Type</Label>
          <select
            id="contentType"
            value={form.contentType}
            onChange={(e) => set("contentType", e.target.value as typeof form.contentType)}
            className={SELECT_CLASS}
          >
            <option value="STOCK">Stock</option>
            <option value="REVIEW">Review</option>
            <option value="REEL">Reel</option>
            <option value="FEATURE">Feature</option>
            <option value="NEWS">News</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="postedAt">Posted Date</Label>
          <Input
            id="postedAt"
            type="date"
            value={form.postedAt}
            onChange={(e) => set("postedAt", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="instagramMediaId">Instagram Media ID</Label>
          <Input
            id="instagramMediaId"
            value={form.instagramMediaId}
            onChange={(e) => set("instagramMediaId", e.target.value)}
            placeholder="Optional — for future ingestion matching"
          />
        </div>
      </Fieldset>

      <Fieldset title="Vehicle Link &amp; Status">
        <div>
          <Label htmlFor="vehicleId">Vehicle</Label>
          <select
            id="vehicleId"
            value={form.vehicleId}
            onChange={(e) => set("vehicleId", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">— Editorial (no vehicle) —</option>
            {vehicleOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Linking never creates or changes vehicle inventory — it&apos;s a reference only.
          </p>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as typeof form.status)}
            className={SELECT_CLASS}
          >
            <option value="INBOX">Inbox</option>
            <option value="CLASSIFIED">Classified</option>
            <option value="PUBLISHED">Published</option>
            <option value="IGNORED">Ignored</option>
          </select>
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Only Published content is visible on the public site — a thumbnail is required first.
          </p>
        </div>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Content"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/admin/content")}
        >
          Cancel
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
        {saved && <span className="font-body text-[13px] text-success">Saved.</span>}
        {error && <span className="font-body text-[13px] text-primary">{error}</span>}
      </div>
    </form>
  );
}
