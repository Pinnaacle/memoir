import type { SelectedImage } from '@/components/ui/AddImageField';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_BUCKET_ID,
  IMAGE_BUCKET_FOLDERS,
  MAX_UPLOAD_BYTES,
  type ImageBucket,
} from '@/lib/images';
import { supabase } from '@/lib/supabase';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export { getCurrentUploadContext } from '@/services/userContext';

export type UploadedImage = {
  storagePath: string;
};

type UploadImageArgs = {
  image: SelectedImage;
  bucket: ImageBucket;
  groupId: string;
  userId: string;
};

const COMPRESSED_MAX_EDGE = 1600;
const COMPRESSED_QUALITY = 0.75;
const COMPRESSED_EXTENSION = 'jpg';
const COMPRESSED_MIME = 'image/jpeg';

function generateObjectId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}`;
}

function isAllowedMimeType(mime: string | null | undefined): boolean {
  if (!mime) {
    return true;
  }

  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
    mime.toLowerCase(),
  );
}

function getResizeTarget(
  width: number | undefined,
  height: number | undefined,
): { width?: number; height?: number } | null {
  // Source dimensions unknown; let manipulator load at native size and
  // only re-encode to apply JPEG compression.
  if (!width || !height || Math.max(width, height) <= COMPRESSED_MAX_EDGE) {
    return null;
  }

  return width >= height
    ? { width: COMPRESSED_MAX_EDGE }
    : { height: COMPRESSED_MAX_EDGE };
}

export async function uploadEntityImage({
  image,
  bucket,
  groupId,
  userId,
}: UploadImageArgs): Promise<UploadedImage> {
  if (!isAllowedMimeType(image.mimeType)) {
    throw new Error('Unsupported image type.');
  }

  const context = ImageManipulator.manipulate(image.uri);
  const resizeTarget = getResizeTarget(image.width, image.height);

  if (resizeTarget) {
    context.resize(resizeTarget);
  }

  const rendered = await context.renderAsync();
  const compressed = await rendered.saveAsync({
    compress: COMPRESSED_QUALITY,
    format: SaveFormat.JPEG,
  });

  const response = await fetch(compressed.uri);

  if (!response.ok) {
    throw new Error('Could not read compressed image.');
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_UPLOAD_BYTES) {
    const mb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
    throw new Error(`Image is still larger than ${mb} MB after compression.`);
  }

  const objectPath = `${IMAGE_BUCKET_FOLDERS[bucket]}/${groupId}/${userId}/${generateObjectId()}.${COMPRESSED_EXTENSION}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET_ID)
    .upload(objectPath, arrayBuffer, {
      contentType: COMPRESSED_MIME,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  return { storagePath: objectPath };
}
