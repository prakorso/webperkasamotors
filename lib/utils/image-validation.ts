/**
 * Shared client-side image validation — used by every admin image
 * uploader (Vehicle Photos, Hero, Logo, Favicon, OG Image) so the rules
 * (and the messages shown for breaking them) are defined once instead of
 * copied into each uploader component.
 *
 * HEIC/HEIF rejection came from a real bug: HEIC uploads succeeded (the
 * object and DB row were both created correctly) but couldn't be
 * *rendered* — most non-Safari browsers can't decode image/heic in an
 * <img> tag. Detection checks both the reported MIME type and the file
 * extension, since browsers are inconsistent about setting `file.type`
 * for HEIC (Safari usually does; others report an empty string).
 *
 * No automatic HEIC conversion — that would need a new client-side
 * decoding dependency this project doesn't have, more complexity than a
 * one-time phone-camera-settings fix warrants.
 */

const HEIC_MIME_TYPES = ["image/heic", "image/heif"];
const HEIC_EXTENSIONS = [".heic", ".heif"];

/** Generous on purpose — this is a safety ceiling against pathological files, not a practical limit on real photos. */
const DEFAULT_MAX_SIZE_BYTES = 20 * 1024 * 1024;

export function isHeicFile(file: File): boolean {
  if (HEIC_MIME_TYPES.includes(file.type.toLowerCase())) return true;
  const name = file.name.toLowerCase();
  return HEIC_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export interface ImageValidationOptions {
  /** Defaults to 20MB — override per-uploader only if there's a specific reason. */
  maxSizeBytes?: number;
  /** Vehicle Photos also accepts short video clips alongside images — every other uploader is image-only. */
  allowVideo?: boolean;
}

/** Returns a user-facing error message, or null if the file is acceptable. */
export function validateImageFile(file: File, options: ImageValidationOptions = {}): string | null {
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  if (file.size === 0) return "No file selected.";

  if (isHeicFile(file)) {
    return "HEIC/HEIF photos aren't supported by browsers yet. On iPhone: Settings → Camera → Formats → Most Compatible. Or share it via Messages/WhatsApp first — that usually converts it automatically.";
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = Boolean(options.allowVideo) && file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return options.allowVideo
      ? "Only image or video files are supported."
      : "Only image files are supported (JPG, PNG, WebP, or GIF).";
  }

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return `File is too large — please use an image under ${maxMb}MB.`;
  }

  return null;
}
