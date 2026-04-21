import type { SelectedImage } from '@/components/ui/AddImageField';
import type { ImageBucket } from '@/lib/images';
import {
  getCurrentUploadContext,
  uploadEntityImage,
  type UploadedImage,
} from '@/services/imageUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

type SetImages = (
  updater: (current: SelectedImage[]) => SelectedImage[],
) => void;

type UseImageUploadArgs = {
  bucket: ImageBucket;
  setImages: SetImages;
};

type UploadContext = { userId: string; groupId: string };

type UploadVariables = {
  image: SelectedImage;
  context: UploadContext;
};

export const imageUploadKeys = {
  context: ['image-upload', 'context'] as const,
};

export function useImageUpload({ bucket, setImages }: UseImageUploadArgs) {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation<UploadedImage, Error, UploadVariables>({
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
        queryKey: imageUploadKeys.context,
        queryFn: getCurrentUploadContext,
        staleTime: Infinity,
      }),
    [queryClient],
  );

  const startUpload = useCallback(
    async (newImages: SelectedImage[]) => {
      if (newImages.length === 0) {
        return;
      }

      setImages((current) =>
        current.map((image) =>
          newImages.some((picked) => picked.id === image.id)
            ? { ...image, uploadStatus: 'uploading', uploadError: null }
            : image,
        ),
      );

      let context: UploadContext;

      try {
        context = await ensureContext();
      } catch (error) {
        queryClient.removeQueries({ queryKey: imageUploadKeys.context });
        const message =
          error instanceof Error ? error.message : 'Could not prepare upload.';

        setImages((current) =>
          current.map((image) =>
            newImages.some((picked) => picked.id === image.id)
              ? { ...image, uploadStatus: 'failed', uploadError: message }
              : image,
          ),
        );
        return;
      }

      await Promise.all(
        newImages.map(async (image) => {
          try {
            const uploaded = await uploadMutation.mutateAsync({
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
          }
        }),
      );
    },
    [ensureContext, queryClient, setImages, uploadMutation],
  );

  return { startUpload };
}
