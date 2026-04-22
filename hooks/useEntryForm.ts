import {
  type SelectedImage,
  type ImageUploadStatus,
} from '@/components/ui/AddImageField';
import {
  SAVE_SUCCESS_FEEDBACK_MS,
  triggerErrorFeedback,
  triggerSuccessFeedback,
  type SaveState,
  wait,
} from '@/lib/interaction';
import { type ImageBucket, MAX_IMAGES_PER_UPLOAD } from '@/lib/images';
import { useEffect, useMemo, useState } from 'react';
import { useImageUpload } from './useImageUpload';

const SAVE_TIMEOUT_MS = 10000;
const UPLOADING_STATES: ImageUploadStatus[] = ['local', 'uploading'];

type UseEntryFormOptions = {
  bucket: ImageBucket;
  initialPhotos: SelectedImage[];
  onSaved: () => void;
  saveErrorMessage: string;
};

function getUploadedPhotos(photos: SelectedImage[]) {
  return photos
    .filter(
      (photo) =>
        photo.uploadStatus === 'uploaded' && Boolean(photo.storagePath),
    )
    .slice(0, MAX_IMAGES_PER_UPLOAD)
    .map((photo) => ({ storagePath: photo.storagePath! }));
}

function getFailedUploadMessage(uploadError: string | null) {
  return uploadError
    ? `Some photos failed to upload: ${uploadError}`
    : 'Some photos failed to upload. Remove or retry them before saving.';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(fallback));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

export function useEntryForm({
  bucket,
  initialPhotos,
  onSaved,
  saveErrorMessage,
}: UseEntryFormOptions) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const { startUpload } = useImageUpload({
    bucket,
    setImages: setPhotos,
  });
  const isUploading = photos.some((photo) =>
    UPLOADING_STATES.includes(photo.uploadStatus ?? 'uploaded'),
  );
  const failedUploads = photos.filter(
    (photo) => photo.uploadStatus === 'failed',
  );
  const uploadedPhotos = useMemo(() => getUploadedPhotos(photos), [photos]);
  const retryUploadsDisabled = isUploading || isSaving;
  const submitError =
    (isUploading ? 'Please wait for photos to finish uploading.' : null) ??
    saveError;
  const saveDisabled = isSaving || saveState === 'saved' || isUploading;
  const firstFailedUploadError =
    failedUploads.find((photo) => photo.uploadError)?.uploadError ?? null;

  useEffect(() => {
    if (!saveError && saveState !== 'error') {
      return;
    }

    setSaveError(null);
    if (saveState === 'error') {
      setSaveState('idle');
    }
  }, [photos, saveError, saveState]);

  async function handleRetryFailedUploads() {
    if (retryUploadsDisabled) {
      return;
    }

    setSaveError(null);
    const result = await startUpload(failedUploads);

    if (result.failedIds.length === 0) {
      void triggerSuccessFeedback();
      return;
    }

    setSaveError(getFailedUploadMessage(firstFailedUploadError));
    void triggerErrorFeedback();
  }

  async function handleSave(isValid: boolean, submit: () => Promise<unknown>) {
    if (isSaving || saveState === 'saved') {
      return;
    }

    setHasTriedSubmit(true);
    setSaveError(null);

    if (!isValid) {
      setSaveState('error');
      void triggerErrorFeedback();
      return;
    }

    if (isUploading) {
      setSaveState('idle');
      return;
    }

    if (failedUploads.length > 0) {
      setSaveError(getFailedUploadMessage(firstFailedUploadError));
      setSaveState('error');
      void triggerErrorFeedback();
      return;
    }

    setIsSaving(true);
    setSaveState('saving');

    try {
      await withTimeout(submit(), SAVE_TIMEOUT_MS, saveErrorMessage);
      setSaveState('saved');
      void triggerSuccessFeedback();
      await wait(SAVE_SUCCESS_FEEDBACK_MS);
      onSaved();
    } catch (error) {
      setSaveError(getErrorMessage(error, saveErrorMessage));
      setSaveState('error');
      void triggerErrorFeedback();
    } finally {
      setIsSaving(false);
    }
  }

  return {
    failedUploads,
    handleRetryFailedUploads,
    handleSave,
    hasTriedSubmit,
    photos,
    retryUploadsDisabled,
    saveDisabled,
    saveState,
    setPhotos,
    startUpload,
    submitError,
    uploadedPhotos,
  };
}
