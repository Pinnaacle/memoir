import type { SelectedImage } from '@/components/ui/AddImageField';
import type { ImageBucket } from '@/lib/images';
import {
  getUploadContextForGroup,
  uploadEntityImage,
  type UploadedImage,
} from '@/services/imageUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type SetImages = (
  updater: (current: SelectedImage[]) => SelectedImage[],
) => void;

type UseImageUploadArgs = {
  groupId: string | null;
  bucket: ImageBucket;
  setImages: SetImages;
};

type UploadContext = { userId: string; groupId: string };

type UploadVariables = {
  image: SelectedImage;
  context: UploadContext;
};

export type UploadBatchResult = {
  failedIds: string[];
  uploadedIds: string[];
};

export const imageUploadKeys = {
  context: (groupId: string | null) =>
    ['image-upload', 'context', groupId ?? 'no-group'] as const,
};

function createUploadResult(): UploadBatchResult {
  return {
    failedIds: [],
    uploadedIds: [],
  };
}

function getImageIds(images: SelectedImage[]) {
  return new Set(images.map((image) => image.id));
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useImageUpload({
  bucket,
  groupId,
  setImages,
}: UseImageUploadArgs) {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation<UploadedImage, Error, UploadVariables>({
    mutationFn: ({ image, context }) =>
      uploadEntityImage({
        image,
        bucket,
        groupId: context.groupId,
        userId: context.userId,
      }),
    retry: 1,
  });

  function ensureContext() {
    return queryClient.ensureQueryData({
      queryKey: imageUploadKeys.context(groupId),
      queryFn: () => getUploadContextForGroup(groupId),
      staleTime: Infinity,
    });
  }

  function updateImages(
    imageIds: Set<string>,
    changes: Partial<SelectedImage>,
  ) {
    setImages((current) =>
      current.map((image) =>
        imageIds.has(image.id) ? { ...image, ...changes } : image,
      ),
    );
  }

  function updateImage(imageId: string, changes: Partial<SelectedImage>) {
    setImages((current) =>
      current.map((image) =>
        image.id === imageId ? { ...image, ...changes } : image,
      ),
    );
  }

  function markImagesAsUploading(images: SelectedImage[]) {
    updateImages(getImageIds(images), {
      uploadStatus: 'uploading',
      uploadError: null,
    });
  }

  async function uploadOneImage(
    image: SelectedImage,
    context: UploadContext,
    result: UploadBatchResult,
  ) {
    try {
      const uploaded = await mutateAsync({ image, context });

      updateImage(image.id, {
        storagePath: uploaded.storagePath,
        uploadStatus: 'uploaded',
        uploadError: null,
      });
      result.uploadedIds.push(image.id);
    } catch (error) {
      updateImage(image.id, {
        uploadStatus: 'failed',
        uploadError: getErrorMessage(error, 'Upload failed.'),
      });
      result.failedIds.push(image.id);
    }
  }




  async function startUpload(
    newImages: SelectedImage[],
  ): Promise<UploadBatchResult> {
    // 1. Track which images succeed and which ones fail.
    const result = createUploadResult();

    if (newImages.length === 0) {
      return result;
    }

    // 2. Show upload progress in the UI right away.
    const imageIds = getImageIds(newImages);
    markImagesAsUploading(newImages);

    // 3. Get the user and Space used in the Storage path.
    let context: UploadContext;

    try {
      context = await ensureContext();
    } catch (error) {
      queryClient.removeQueries({
        queryKey: imageUploadKeys.context(groupId),
      });

      updateImages(imageIds, {
        uploadStatus: 'failed',
        uploadError: getErrorMessage(error, 'Could not prepare upload.'),
      });

      result.failedIds.push(...newImages.map((image) => image.id));

      return result;
    }

    // 4. Upload each selected image and update its status.
    for (const image of newImages) {
      await uploadOneImage(image, context, result);
    }

    // 5. The caller uses this result for retry and error UI.
    return result;
  }

  return { startUpload };
}
