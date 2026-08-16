"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud, ChevronUp, ChevronDown, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uploadImage, rollbackImageUpload } from "@/lib/storage/upload-image";
import { validateImageFile } from "@/lib/utils/image-validation";
import {
  recordVehicleMediaUpload,
  setPrimaryVehicleMedia,
  reorderVehicleMedia,
  deleteVehicleMedia,
  type VehicleMediaType,
} from "@/lib/actions/vehicle-media";
import type { VehicleMedia } from "@/lib/types";

/** Same bucket lib/actions/vehicle-media.ts targets — duplicated as a
 *  literal here rather than shared, matching how other bucket names in
 *  this codebase are scoped to whichever file actually calls Storage. */
const BUCKET = "vehicle-media";

/**
 * Every photo uploaded through this simplified workflow gets this fixed
 * classification — media_type stays a real, required column (unchanged
 * schema, still used elsewhere), but choosing it is no longer part of
 * the admin's job. A one-person operation doesn't need to categorize
 * every photo as Exterior/Interior/Engine/etc. before it can go live.
 */
const DEFAULT_MEDIA_TYPE: VehicleMediaType = "EXTERIOR";

/**
 * Uploads directly from the browser to Supabase Storage (lib/storage/
 * upload-image.ts — never through a Server Action) then records the
 * result via recordVehicleMediaUpload (a small JSON call, no file bytes).
 * This is what actually eliminates the 504s: the file bytes now make one
 * hop (browser -> Supabase), instead of two (browser -> Netlify function
 * -> Supabase), and never sit inside a serverless function's
 * execution-time budget.
 *
 * Validation (HEIC/HEIF rejection, type/size checks) is now shared with
 * every other image uploader via lib/utils/image-validation.ts — same
 * messages as before, just defined once. HEIC/HEIF rejection specifically
 * came from a real bug: "broken image" cards after a multi-photo upload
 * (confirmed live: the objects and DB rows were all created correctly and
 * the public URLs were fully reachable; browsers other than Safari simply
 * can't decode image/heic in an <img> tag).
 */
async function uploadOneFile(
  vehicleId: string,
  file: File
): Promise<{ error: string | null; media?: VehicleMedia }> {
  const validationError = validateImageFile(file, { allowVideo: true });
  if (validationError) return { error: validationError };

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error: uploadError } = await uploadImage({ bucket: BUCKET, path, file });
  if (uploadError) return { error: uploadError };

  const result = await recordVehicleMediaUpload(vehicleId, DEFAULT_MEDIA_TYPE, path);
  if (result.error || !result.media) {
    // The metadata insert failed after a real upload succeeded — roll the
    // upload back so it doesn't linger as an orphaned file.
    await rollbackImageUpload(BUCKET, path);
    return { error: result.error ?? "Could not save this photo. Please try again." };
  }
  return { error: null, media: result.media };
}

export function VehicleMediaManager({
  vehicleId,
  initialMedia,
}: {
  vehicleId: string;
  initialMedia: VehicleMedia[];
}) {
  const [media, setMedia] = useState(initialMedia);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);

    startTransition(async () => {
      // Collected rather than set immediately per-file: with several
      // files in one batch, an earlier failure's message would
      // otherwise get silently overwritten by a later file's result —
      // one bad file (e.g. a HEIC photo) should never hide what
      // happened to the others, and every valid file in the same batch
      // still uploads regardless of what happens to the others.
      const failures: string[] = [];
      for (const file of files) {
        const result = await uploadOneFile(vehicleId, file);
        if (result.error || !result.media) {
          failures.push(`${file.name}: ${result.error ?? "Upload failed."}`);
          continue;
        }
        const uploaded = result.media;
        setMedia((prev) =>
          uploaded.isPrimary ? [...prev.map((m) => ({ ...m, isPrimary: false })), uploaded] : [...prev, uploaded]
        );
      }
      if (failures.length > 0) setError(failures.join(" • "));
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSetPrimary(mediaId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setPrimaryVehicleMedia(vehicleId, mediaId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMedia((prev) => prev.map((m) => ({ ...m, isPrimary: m.id === mediaId })));
    });
  }

  function handleDelete(mediaId: string) {
    if (!confirm("Delete this photo? This removes the file permanently.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteVehicleMedia(mediaId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const reordered = [...media];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setMedia(reordered);
    setError(null);

    startTransition(async () => {
      const result = await reorderVehicleMedia(
        reordered.map((item, i) => ({ id: item.id, sortOrder: i + 1 }))
      );
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="font-body text-[13px] text-primary">{error}</p>}

      {media.length === 0 ? (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-body text-[13px] text-muted">No photos uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.map((item, index) => (
            <div key={item.id} className="border border-border bg-surface">
              <div className="relative aspect-square overflow-hidden bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.altText || "Vehicle photo"} className="h-full w-full object-cover" />
                {item.isPrimary && (
                  <span className="absolute left-1.5 top-1.5">
                    <Badge variant="primary">Primary</Badge>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-end gap-0.5 p-1.5">
                <button
                  type="button"
                  disabled={index === 0 || pending}
                  onClick={() => move(index, -1)}
                  aria-label="Move earlier"
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <ChevronUp size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={index === media.length - 1 || pending}
                  onClick={() => move(index, 1)}
                  aria-label="Move later"
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <ChevronDown size={14} aria-hidden />
                </button>
                {!item.isPrimary && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleSetPrimary(item.id)}
                    aria-label="Set as primary photo"
                    className="p-1 text-muted hover:text-primary disabled:opacity-30"
                  >
                    <Star size={14} aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete photo"
                  className="p-1 text-muted hover:text-primary disabled:opacity-30"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 border border-border bg-surface p-4">
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={16} aria-hidden />
            {pending ? "Uploading…" : "Upload Photos"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
        </div>
        <p className="font-body text-[12px] text-muted-2">
          Upload all vehicle photos at once. Select one photo as Primary.
        </p>
      </div>
    </div>
  );
}
