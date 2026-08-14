"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud, ChevronUp, ChevronDown, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  uploadVehicleMedia,
  setPrimaryVehicleMedia,
  reorderVehicleMedia,
  deleteVehicleMedia,
  type VehicleMediaType,
} from "@/lib/actions/vehicle-media";
import type { VehicleMedia } from "@/lib/types";

const MEDIA_TYPE_OPTIONS: VehicleMediaType[] = [
  "EXTERIOR",
  "INTERIOR",
  "ENGINE",
  "WHEELS",
  "WALKAROUND",
  "DOCUMENT",
  "VIDEO",
  "OTHER",
];

const SELECT_CLASS =
  "h-11 border border-border bg-surface px-3 font-body text-body text-ink focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

export function VehicleMediaManager({
  vehicleId,
  initialMedia,
}: {
  vehicleId: string;
  initialMedia: VehicleMedia[];
}) {
  const [media, setMedia] = useState(initialMedia);
  const [mediaType, setMediaType] = useState<VehicleMediaType>("EXTERIOR");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);

    startTransition(async () => {
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadVehicleMedia(vehicleId, mediaType, formData);
        if (result.error || !result.media) {
          setError(result.error ?? "Upload failed.");
          continue;
        }
        const uploaded = result.media;
        setMedia((prev) =>
          uploaded.isPrimary ? [...prev.map((m) => ({ ...m, isPrimary: false })), uploaded] : [...prev, uploaded]
        );
      }
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
                <img src={item.url} alt={item.altText || item.mediaType} className="h-full w-full object-cover" />
                {item.isPrimary && (
                  <span className="absolute left-1.5 top-1.5">
                    <Badge variant="primary">Primary</Badge>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <span className="truncate font-body text-[11px] uppercase tracking-[0.06em] text-muted">
                  {item.mediaType}
                </span>
                <div className="flex items-center gap-0.5">
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
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border border-border bg-surface p-4">
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as VehicleMediaType)}
          className={SELECT_CLASS}
          aria-label="Photo type for the next upload"
        >
          {MEDIA_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
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
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />
        <span className="font-body text-[12px] text-muted-2">
          The first photo uploaded becomes primary automatically.
        </span>
      </div>
    </div>
  );
}
