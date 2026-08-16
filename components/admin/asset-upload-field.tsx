"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { uploadImage, rollbackImageUpload } from "@/lib/storage/upload-image";
import { validateImageFile } from "@/lib/utils/image-validation";
import type { SiteAssetField } from "@/lib/actions/site-settings";

const BUCKET = "site-assets";

interface AssetUploadFieldProps {
  field: SiteAssetField;
  label: string;
  hint: string;
  currentUrl: string | null;
  /** Metadata-only — receives the storage path of an object already uploaded to Supabase Storage, never a File. */
  action: (field: SiteAssetField, storagePath: string) => Promise<{ error: string | null }>;
}

/**
 * Upload control for logo/favicon/OG image/hero image. Uploads directly
 * from the browser to Supabase Storage (lib/storage/upload-image.ts) —
 * never through a Server Action — then calls `action` with only the
 * resulting storage path. This is the same shape as Vehicle Photos
 * (components/admin/vehicle-media-manager.tsx): file bytes make one hop
 * (browser -> Supabase), never a second hop through a Netlify function.
 *
 * REVISED (Phase 5 Media Architecture): previously packed the File into
 * FormData and handed it to a Server Action that uploaded from inside
 * itself — that's what was producing 504s on Hero (and, less visibly,
 * would eventually have hit Logo/Favicon/OG Image too; see
 * lib/actions/site-settings.ts:recordSiteAsset's own comment for why
 * Logo/Favicon occasionally survived it while Hero/OG Image didn't).
 *
 * Validation (HEIC/HEIF rejection, type/size checks) is shared with every
 * other image uploader via lib/utils/image-validation.ts. On a metadata
 * save failure after a successful upload, the just-uploaded object is
 * rolled back (removed) so it doesn't linger orphaned in Storage.
 */
export function AssetUploadField({ field, label, hint, currentUrl, action }: AssetUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${field}-${Date.now()}.${extension}`;

      const { error: uploadError } = await uploadImage({
        bucket: BUCKET,
        path,
        file,
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) {
        setError(uploadError);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      const result = await action(field, path);
      if (result.error) {
        // The metadata update failed after a real upload succeeded — roll
        // the upload back so it doesn't linger as an orphaned file.
        await rollbackImageUpload(BUCKET, path);
        setError(result.error);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      setSuccess(true);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-4 border border-border bg-surface p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-surface-muted">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt={label} className="h-full w-full object-contain" />
          ) : (
            <UploadCloud className="text-muted-2" size={20} aria-hidden />
          )}
        </div>
        <div className="flex-1">
          <p className="font-body text-[13px] text-ink">
            {currentUrl ? "Asset uploaded" : "No asset uploaded yet"}
          </p>
          <p className="mt-0.5 font-body text-[12px] text-muted">{hint}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
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
      {success && (
        <p className="mt-1.5 font-body text-[12px] text-success">Uploaded successfully.</p>
      )}
    </div>
  );
}
