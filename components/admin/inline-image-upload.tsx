"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/storage/upload-image";
import { validateImageFile } from "@/lib/utils/image-validation";

/**
 * A smaller sibling of AssetUploadField for list-row images (Testimonial
 * photos) rather than singleton website_settings fields — AssetUploadField's
 * `action` prop is shaped specifically around SiteAssetField + a direct
 * website_settings write, which doesn't fit a per-row entity. This
 * control does the identical upload half of that flow (validate ->
 * upload directly to Supabase Storage from the browser, never through a
 * Server Action) and hands the caller the resulting storage path; the
 * caller is responsible for including that path in its own
 * create/update Server Action call, and for cleanup (see
 * lib/actions/testimonials.ts's own comment on this split).
 */
export function InlineImageUpload({
  bucket,
  pathPrefix,
  currentUrl,
  onUploaded,
  label,
  hint,
}: {
  bucket: string;
  pathPrefix: string;
  currentUrl: string | null;
  onUploaded: (path: string) => void;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    startTransition(async () => {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${pathPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

      const { error: uploadError } = await uploadImage({ bucket, path, file });
      if (uploadError) {
        setError(uploadError);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      setPreviewUrl(URL.createObjectURL(file));
      onUploaded(path);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div>
      <p className="mb-2 block font-body text-label font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
      <div className="flex items-center gap-4 border border-border bg-surface p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
          ) : (
            <UploadCloud className="text-muted-2" size={18} aria-hidden />
          )}
        </div>
        <div className="flex-1">
          <p className="font-body text-[13px] text-ink">{previewUrl ? "Photo set" : "No photo"}</p>
          {hint && <p className="mt-0.5 font-body text-[12px] text-muted">{hint}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Uploading…" : previewUrl ? "Replace" : "Upload"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
      {error && <p className="mt-1.5 font-body text-[12px] text-primary">{error}</p>}
    </div>
  );
}
