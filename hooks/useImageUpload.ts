import type { SelectedImage } from '@/components/ui/AddImageField';
import type { ImageBucket } from '@/lib/images';
import {
  getUploadContextForGroup,
  uploadEntityImage,
  type UploadedImage,
} from '@/services/imageUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

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

  const ensureContext = useCallback(
    () =>
      queryClient.ensureQueryData({
        queryKey: imageUploadKeys.context(groupId),
        queryFn: () => getUploadContextForGroup(groupId),
        staleTime: Infinity,
      }),
    [groupId, queryClient],
  );

  const startUpload = useCallback(
    async (newImages: SelectedImage[]): Promise<UploadBatchResult> => {
      const result: UploadBatchResult = {
        failedIds: [],
        uploadedIds: [],
      };

      if (newImages.length === 0) {
        return result;
      }

      const imageIds = new Set(newImages.map((image) => image.id));

      setImages((current) =>
        current.map((image) =>
          imageIds.has(image.id)
            ? { ...image, uploadStatus: 'uploading', uploadError: null }
            : image,
        ),
      );

      let context: UploadContext;

      try {
        // Active Space keeps Storage paths aligned with database group_id rows.
        context = await ensureContext();
      } catch (error) {
        queryClient.removeQueries({
          queryKey: imageUploadKeys.context(groupId),
        });
        const message =
          error instanceof Error ? error.message : 'Could not prepare upload.';

        setImages((current) =>
          current.map((image) =>
            imageIds.has(image.id)
              ? { ...image, uploadStatus: 'failed', uploadError: message }
              : image,
          ),
        );
        result.failedIds.push(...newImages.map((image) => image.id));

        return result;
      }

      await Promise.all(
        newImages.map(async (image) => {
          try {
            const uploaded = await mutateAsync({
              image,
              context,
            });

            setImages((current) =>
              current.map((existing) =>
                existing.id === image.id
                  ? {
                      ...existing,
                      storagePath: uploaded.storagePath,
                      uploadStatus: 'uploaded',
                      uploadError: null,
                    }
                  : existing,
              ),
            );
            result.uploadedIds.push(image.id);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Upload failed.';

            setImages((current) =>
              current.map((existing) =>
                existing.id === image.id
                  ? {
                      ...existing,
                      uploadStatus: 'failed',
                      uploadError: message,
                    }
                  : existing,
              ),
            );
            result.failedIds.push(image.id);
          }
        }),
      );

      return result;
    },
    [ensureContext, groupId, mutateAsync, queryClient, setImages],
  );

  return { startUpload };
}
