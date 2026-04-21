import { supabase } from '@/lib/supabase';

export const MAX_IMAGES_PER_UPLOAD = 5;

/**
 * Ceiling applied to the compressed output produced on-device before upload.
 * Source images larger than this are compressed to fit; uploads that still
 * exceed this size after compression are rejected.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

/**
 * Supabase bucket IDs cannot contain "/".
 * We store all photos in the single `memoir` bucket and namespace by folder.
 */
export const IMAGE_BUCKET_ID = 'memoir';

export const IMAGE_BUCKET_FOLDERS = {
  moments: 'moments',
  events: 'events',
} as const;

export type ImageBucket = keyof typeof IMAGE_BUCKET_FOLDERS;

/**
 * Signed URL lifetime. The `memoir` bucket is private, so every render URL
 * is short-lived. TanStack Query caches the enclosing service results, so
 * URLs are reused until the query is refetched.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Batch-sign multiple image paths from the same bucket. Returns a map from
 * storage path to signed URL for paths that succeeded.
 */
export async function getSignedImageUrlMap(
  storagePaths: readonly string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  if (storagePaths.length === 0) {
    return map;
  }

  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET_ID)
    .createSignedUrls(Array.from(storagePaths), SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return map;
  }

  for (const entry of data) {
    if (entry.path && entry.signedUrl) {
      map.set(entry.path, entry.signedUrl);
    }
  }

  return map;
}
