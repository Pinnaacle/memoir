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

export { getUploadContextForGroup } from '@/services/userContext';

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

function getStoragePath({
  bucket,
  groupId,
  userId,
}: Omit<UploadImageArgs, 'image'>) {
  return `${IMAGE_BUCKET_FOLDERS[bucket]}/${groupId}/${userId}/${generateObjectId()}.${COMPRESSED_EXTENSION}`;
}

function assertAllowedImageType(image: SelectedImage) {
  if (!isAllowedMimeType(image.mimeType)) {
    throw new Error('Unsupported image type.');
  }
}




export async function uploadEntityImage(
  args: UploadImageArgs,
): Promise<UploadedImage> {
  const { image } = args;

  // 1. Reject file types this app does not support.
  assertAllowedImageType(image);

  // 2. Resize large images before saving them as JPEG.
  const manipulator = ImageManipulator.manipulate(image.uri);
  const resizeTarget = getResizeTarget(image.width, image.height);

  if (resizeTarget) {
    manipulator.resize(resizeTarget);
  }

  const renderedImage = await manipulator.renderAsync();
  const compressedImage = await renderedImage.saveAsync({
    compress: 0.75,
    format: SaveFormat.JPEG,
  });

  // 3. Read the compressed file into data Supabase can upload.
  const response = await fetch(compressedImage.uri);

  if (!response.ok) {
    throw new Error('Could not read compressed image.');
  }

  const imageFile = await response.arrayBuffer();

  // 4. Stop if compression still left the image too large.
  if (imageFile.byteLength > MAX_UPLOAD_BYTES) {
    const mb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
    throw new Error(`Image is still larger than ${mb} MB after compression.`);
  }

  // 5. Upload the final JPEG to Supabase Storage.
  const storagePath = getStoragePath(args);
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET_ID)
    .upload(storagePath, imageFile, {
      contentType: COMPRESSED_MIME,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return { storagePath };
}


