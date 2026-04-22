import { DatePicker } from '@/components/DatePicker';
import ModalTopBar from '@/components/ModalTopBar';
import {
  AddImageField,
  type SelectedImage,
} from '@/components/ui/AddImageField';
import Divider from '@/components/ui/Divider';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import {
  useCreateMomentMutation,
  useUpdateMomentMutation,
} from '@/hooks/useMoments';
import { useImageUpload } from '@/hooks/useImageUpload';
import { MAX_IMAGES_PER_UPLOAD } from '@/lib/images';
import {
  createMomentSchema,
  type CreateMomentValues,
} from '@/lib/validation/moment';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { useForm } from '@tanstack/react-form';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SAVE_TIMEOUT_MS = 10000;
const MOMENT_TYPE_OPTIONS = [
  { label: 'Food', value: 'food' },
  { label: 'Outfit', value: 'outfit' },
  { label: 'Tiny Joy', value: 'tiny-joy' },
  { label: 'Cozy Scene', value: 'cozy-scene' },
  { label: 'Nature', value: 'nature' },
  { label: 'Connection', value: 'connection' },
  { label: 'Personal Win', value: 'personal-win' },
];

export type MomentFormProps = {
  activeGroupId: string | null;
  momentId?: string;
  initialPhotos: SelectedImage[];
  initialValues: CreateMomentValues;
  isEdit: boolean;
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

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Failed to save moment. Please try again.';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Failed to save moment. Please try again.'));
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

export default function MomentForm({
  activeGroupId,
  momentId,
  initialPhotos,
  initialValues,
  isEdit,
}: MomentFormProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const createMomentMutation = useCreateMomentMutation();
  const updateMomentMutation = useUpdateMomentMutation();
  const { startUpload } = useImageUpload({
    bucket: 'moments',
    setImages: setPhotos,
  });
  const isUploading = photos.some(
    (photo) => photo.uploadStatus === 'uploading',
  );
  const failedUploads = photos.filter(
    (photo) => photo.uploadStatus === 'failed',
  );
  const hasFailedUploads = failedUploads.length > 0;
  const firstFailedUploadError =
    failedUploads.find((photo) => Boolean(photo.uploadError))?.uploadError ??
    null;
  const uploadedPhotos = getUploadedPhotos(photos);
  const retryUploadsDisabled = isUploading || isSaving;

  const saveMoment = async (values: CreateMomentValues, groupId: string) => {
    if (isEdit && momentId) {
      await updateMomentMutation.mutateAsync({
        momentId,
        ...values,
        groupId,
        photos: uploadedPhotos,
      });
      return;
    }

    await createMomentMutation.mutateAsync({
      ...values,
      groupId,
      photos: uploadedPhotos,
    });
  };

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      const parsed = createMomentSchema.safeParse(value);

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      }

      if (!activeGroupId) {
        throw new Error('Choose a space before saving this moment.');
      }

      try {
        await saveMoment(parsed.data, activeGroupId);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }

        throw new Error('Failed to save moment. Please try again.');
      }

      router.back();
    },
  });

  const validation = useMemo(
    () => createMomentSchema.safeParse(form.state.values),
    [form.state.values],
  );
  const fieldErrors = validation.success
    ? {}
    : validation.error.flatten().fieldErrors;
  const submitError = saveError ?? form.state.errorMap.onSubmit;

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setHasTriedSubmit(true);
    setSaveError(null);
    if (!validation.success) {
      return;
    }

    if (isUploading) {
      setSaveError('Please wait for photos to finish uploading.');
      return;
    }

    if (hasFailedUploads) {
      setSaveError(getFailedUploadMessage(firstFailedUploadError));
      return;
    }

    if (!activeGroupId) {
      setSaveError('Choose a space before saving this moment.');
      return;
    }

    setIsSaving(true);

    try {
      await withTimeout(form.handleSubmit(), SAVE_TIMEOUT_MS);
    } catch (error) {
      setSaveError(getErrorMessage(error));
      setIsSaving(false);
    }
  };

  function handleRetryFailedUploads() {
    setSaveError(null);
    void startUpload(failedUploads);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ModalTopBar
          color={sectionColors.moments}
          onClose={() => router.back()}
          onSave={handleSave}
          title={isEdit ? 'Edit Moment' : 'New Moment'}
        />
        <Divider color={sectionColors.moments} />

        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <form.Field name="momentType">
              {(field) => (
                <Dropdown
                  color={sectionColors.moments}
                  onChange={field.handleChange}
                  options={MOMENT_TYPE_OPTIONS}
                  placeholder="Moment type"
                  value={field.state.value || undefined}
                />
              )}
            </form.Field>
            {hasTriedSubmit && fieldErrors.momentType?.[0] ? (
              <Text style={styles.errorText}>{fieldErrors.momentType[0]}</Text>
            ) : null}

            <form.Field name="title">
              {(field) => (
                <Input
                  label="Title"
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  placeholder="Give this moment a memorable title..."
                  required
                  value={field.state.value}
                />
              )}
            </form.Field>
            {hasTriedSubmit && fieldErrors.title?.[0] ? (
              <Text style={styles.errorText}>{fieldErrors.title[0]}</Text>
            ) : null}

            <form.Field name="occurredAt">
              {(field) => (
                <DatePicker
                  color={sectionColors.moments}
                  label="Date"
                  onChange={field.handleChange}
                  required
                  value={field.state.value}
                />
              )}
            </form.Field>
            {hasTriedSubmit && fieldErrors.occurredAt?.[0] ? (
              <Text style={styles.errorText}>{fieldErrors.occurredAt[0]}</Text>
            ) : null}

            <form.Field name="description">
              {(field) => (
                <Input
                  label="Description"
                  minRows={4}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  placeholder="Describe this special moment..."
                  required
                  value={field.state.value}
                  variant="textarea"
                />
              )}
            </form.Field>
            {hasTriedSubmit && fieldErrors.description?.[0] ? (
              <Text style={styles.errorText}>{fieldErrors.description[0]}</Text>
            ) : null}

            <AddImageField
              color={sectionColors.moments}
              maxImages={MAX_IMAGES_PER_UPLOAD}
              onChange={setPhotos}
              onRequestUpload={startUpload}
              value={photos}
            />

            {hasFailedUploads ? (
              <Pressable
                accessibilityHint="Retries failed photo uploads"
                accessibilityLabel="Retry failed uploads"
                accessibilityRole="button"
                disabled={retryUploadsDisabled}
                onPress={handleRetryFailedUploads}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed ? styles.retryButtonPressed : null,
                  retryUploadsDisabled ? styles.retryButtonDisabled : null,
                ]}
              >
                <Text style={styles.retryButtonText}>Retry failed uploads</Text>
              </Pressable>
            ) : null}

            {submitError ? (
              <Text style={styles.errorText}>{submitError}</Text>
            ) : null}

            {isSaving ? (
              <View style={styles.submittingRow}>
                <ActivityIndicator color={sectionColors.moments} />
                <Text style={styles.submittingText}>Saving moment...</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.xl,
  },
  form: {
    gap: space.xl,
  },
  errorText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
    marginTop: -space.md,
  },
  submittingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  submittingText: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderColor: sectionColors.moments,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  retryButtonText: {
    color: sectionColors.moments,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  retryButtonPressed: {
    opacity: 0.82,
  },
  retryButtonDisabled: {
    opacity: 0.45,
  },
});
