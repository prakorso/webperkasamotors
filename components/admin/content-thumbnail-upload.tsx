"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { uploadContentThumbnail } from "@/lib/actions/content";

/**
 * Single-image upload for one content item's thumbnail — "upload" always
 * means "replace" here (content-thumbnails is a single-image slot, unlike
 * vehicle media's ordered gallery). Mirrors components/admin/asset-upload-
 * field.tsx's shape, but scoped to a specific content row via
 * uploadContentThumbnail rather than a site_settings field.
 */
export function ContentThumbnailUpload({
  contentId,
  initialUrl,
}: {
  contentId: string;
  initialUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadContentThumbnail(contentId, formData);
      if (result.error) {
        setError(result.error);
      } else if (result.thumbnailUrl) {
        setUrl(result.thumbnailUrl);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div>
      <Label>Thumbnail</Label>
      <div className="flex items-center gap-4 border border-border bg-surface p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-surface-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <UploadCloud className="text-muted-2" size={20} aria-hidden />
          )}
        </div>
        <div className="flex-1">
          <p className="font-body text-[13px] text-ink">
            {url ? "Thumbnail uploaded" : "No thumbnail uploaded yet"}
          </p>
          <p className="mt-0.5 font-body text-[12px] text-muted">
            Required before this item can be published.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Uploading…" : url ? "Replace" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="mt-1.5 font-body text-[12px] text-primary">{error}</p>}
    </div>
  );
}
