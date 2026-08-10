/** Full-size variant: long edge capped for gallery / lightbox. */
export const FULL_MAX_EDGE = 1600;
export const FULL_JPEG_QUALITY = 0.82;

/** Thumbnail variant: long edge capped for lists and avatars. */
export const THUMB_MAX_EDGE = 400;
export const THUMB_JPEG_QUALITY = 0.72;

export const PLANT_IMAGES_BUCKET = "plant-images";
export const AVATARS_BUCKET = "avatars";

const THUMB_SUFFIX = "_thumb";

export interface ResizeOptions {
  maxEdge: number;
  quality: number;
}

/**
 * Inserts `_thumb` before the file extension.
 * Returns null when the URL already looks like a thumb or has no usable extension.
 */
export function toThumbnailUrl(fullUrl: string | null | undefined): string | null {
  if (!fullUrl) return null;
  if (isThumbnailUrl(fullUrl)) return fullUrl;

  const thumb = insertBeforeExtension(fullUrl, THUMB_SUFFIX);
  return thumb ?? fullUrl;
}

export function isThumbnailUrl(url: string): boolean {
  return /_thumb\.[^./?#]+(?:[?#]|$)/i.test(url);
}

/** Storage path for the paired thumbnail object given a full-size object path. */
export function pairedThumbPath(fullPath: string): string | null {
  return insertBeforeExtension(fullPath, THUMB_SUFFIX);
}

export function storageObjectPathFromPublicUrl(
  publicUrl: string,
  bucket: string,
): string | null {
  const marker = `/object/public/${bucket}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return null;
  return publicUrl.slice(markerIndex + marker.length);
}

export function isStorageImageUrl(url: string, bucket: string): boolean {
  return url.includes(`/object/public/${bucket}/`);
}

function insertBeforeExtension(value: string, suffix: string): string | null {
  const queryIndex = value.search(/[?#]/);
  const base = queryIndex === -1 ? value : value.slice(0, queryIndex);
  const rest = queryIndex === -1 ? "" : value.slice(queryIndex);

  const slash = base.lastIndexOf("/");
  const fileName = slash === -1 ? base : base.slice(slash + 1);
  const prefix = slash === -1 ? "" : base.slice(0, slash + 1);

  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return null;

  const name = fileName.slice(0, dot);
  const ext = fileName.slice(dot);
  if (name.endsWith(suffix)) return `${prefix}${fileName}${rest}`;

  return `${prefix}${name}${suffix}${ext}${rest}`;
}

/**
 * Downscales so the longest edge is at most `maxEdge`, encodes as JPEG.
 * Images already within the limit are still re-encoded as JPEG.
 */
export async function resizeImageFile(
  source: Blob,
  { maxEdge, quality }: ResizeOptions,
): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context for image resize");

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Failed to encode resized image as JPEG"));
        },
        "image/jpeg",
        quality,
      );
    });

    return blob;
  } finally {
    bitmap.close();
  }
}

export async function prepareImageVariants(
  file: Blob,
  baseName = "image",
): Promise<{ full: File; thumb: File }> {
  const [fullBlob, thumbBlob] = await Promise.all([
    resizeImageFile(file, { maxEdge: FULL_MAX_EDGE, quality: FULL_JPEG_QUALITY }),
    resizeImageFile(file, { maxEdge: THUMB_MAX_EDGE, quality: THUMB_JPEG_QUALITY }),
  ]);

  const stem = baseName.replace(/\.[^.]+$/, "") || "image";
  return {
    full: new File([fullBlob], `${stem}.jpg`, { type: "image/jpeg" }),
    thumb: new File([thumbBlob], `${stem}_thumb.jpg`, { type: "image/jpeg" }),
  };
}
