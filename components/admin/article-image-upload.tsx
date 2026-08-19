"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { uploadImage, rollbackImageUpload } from "@/lib/storage/upload-image";
import { validateImageFile } from "@/lib/utils/image-validation";
import { recordArticleImage, type ArticleImageField } from "@/lib/actions/articles";

const BUCKET = "article-media";

/**
 * Cover/OG image upload for one article — same "upload direct from the
 * browser to Supabase Storage, then a metadata-only Server Action"
 * pattern as AssetUploadField (Website Settings) and
 * VehicleMediaManager (Inventory), reusing the same lib/storage/*
 * primitives rather than a new upload path. No crop editor, no
 * position controls — upload replaces the object outright (browser
 * handles responsive presentation on the read side).
 */
export function ArticleImageUpload({
  articleId,
  field,
  label,
  hint,
  currentUrl,
}: {
  articleId: string;
  field: ArticleImageField;
  label: string;
  hint: string;
  currentUrl: string | null;
}) {
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

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${articleId}/${field}-${Date.now()}.${extension}`;

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

      const result = await recordArticleImage(articleId, field, path);
      if (result.error) {
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
            {currentUrl ? "Image uploaded" : "No image uploaded yet"}
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
      {success && <p className="mt-1.5 font-body text-[12px] text-success">Uploaded successfully.</p>}
    </div>
  );
}
