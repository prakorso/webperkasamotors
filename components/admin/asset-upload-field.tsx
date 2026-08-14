"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import type { SiteAssetField } from "@/lib/actions/site-settings";

interface AssetUploadFieldProps {
  field: SiteAssetField;
  label: string;
  hint: string;
  currentUrl: string | null;
  action: (field: SiteAssetField, formData: FormData) => Promise<{ error: string | null }>;
}

/**
 * Upload control for logo/favicon/OG image. No asset exists for any of
 * these yet — currentUrl is null across the board — so this always shows
 * the empty state until something is actually uploaded through it.
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

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await action(field, formData);
      if (result.error) setError(result.error);
      else setSuccess(true);
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
