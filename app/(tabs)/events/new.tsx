import { DatePicker } from '@/components/DatePicker';
import ModalTopBar from '@/components/ModalTopBar';
import {
  AddImageField,
  type SelectedImage,
} from '@/components/ui/AddImageField';
import Chip from '@/components/ui/Chip';
import Divider from '@/components/ui/Divider';
import { Field, Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useCreateEventMutation } from '@/hooks/useEvents';
import { useImageUpload } from '@/hooks/useImageUpload';
import { MAX_IMAGES_PER_UPLOAD } from '@/lib/images';
import {
  createEventSchema,
  type CreateEventValues,
} from '@/lib/validation/event';
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
const MOOD_OPTIONS = [
  'Magical',
  'Romantic',
  'Adventurous',
  'Cozy',
  'Spontaneous',
  'Dreamy',
] as const;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Failed to save event. Please try again.'));
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

export default function NewEventScreen() {
  const { activeGroup } = useActiveGroup();
  const [photos, setPhotos] = useState<SelectedImage[]>([]);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const createEventMutation = useCreateEventMutation();
  const { startUpload } = useImageUpload({
    bucket: 'events',
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
    failedUploads.find((photo) => Boolean(photo.uploadError))?.uploadError ?? null;

  const form = useForm({
    defaultValues: {
      title: '',
      occurredAt: new Date(),
      location: '',
      mood: 'Romantic',
      notes: '',
    } satisfies CreateEventValues,
    onSubmit: async ({ value }) => {
      const parsed = createEventSchema.safeParse(value);

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      }

      if (!activeGroup?.id) {
        throw new Error('Choose a space before saving this event.');
      }

      const uploadedPhotos = photos
        .filter(
          (photo) =>
            photo.uploadStatus === 'uploaded' && Boolean(photo.storagePath),
        )
        .slice(0, MAX_IMAGES_PER_UPLOAD)
        .map((photo) => ({ storagePath: photo.storagePath! }));

      try {
        await createEventMutation.mutateAsync({
          ...parsed.data,
          groupId: activeGroup.id,
          photos: uploadedPhotos,
        });
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }

        throw new Error('Failed to save event. Please try again.');
      }

      router.back();
    },
  });

  const validation = useMemo(
    () => createEventSchema.safeParse(form.state.values),
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
    const parsed = createEventSchema.safeParse(form.state.values);

    if (!parsed.success) {
      return;
    }

    if (isUploading) {
      setSaveError('Please wait for photos to finish uploading.');
      return;
    }

    if (hasFailedUploads) {
      setSaveError(
        firstFailedUploadError
          ? `Some photos failed to upload: ${firstFailedUploadError}`
          : 'Some photos failed to upload. Remove or retry them before saving.',
      );
      return;
    }

    if (!activeGroup?.id) {
      setSaveError('Choose a space before saving this event.');
      return;
    }

    setIsSaving(true);

    try {
      await withTimeout(form.handleSubmit(), SAVE_TIMEOUT_MS);
    } catch (error) {
      if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError('Failed to save event. Please try again.');
      }
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ModalTopBar
          color={sectionColors.events}
          onClose={() => router.back()}
          onSave={handleSave}
          title="New Event"
        />
        <Divider color={sectionColors.events} />

        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <form.Field name="title">
              {(field) => (
                <Input
                  label="Title"
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  placeholder="Give this event a memorable title..."
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
                  color={sectionColors.events}
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

            <form.Field name="location">
              {(field) => (
                <Input
                  label="Location"
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  placeholder="Where did this take place?"
                  required
                  value={field.state.value}
                />
              )}
            </form.Field>
            {hasTriedSubmit && fieldErrors.location?.[0] ? (
              <Text style={styles.errorText}>{fieldErrors.location[0]}</Text>
            ) : null}

            <form.Field name="mood">
              {(field) => (
                <Field label="Mood" required>
                  <View style={styles.moodGrid}>
                    {MOOD_OPTIONS.map((option) => (
                      <Chip
                        key={option}
                        color={sectionColors.events}
                        isSelected={field.state.value === option}
                        label={option}
                        setIsSelected={() => field.handleChange(option)}
                        style={styles.moodChip}
                      />
                    ))}
                  </View>
                </Field>
              )}
            </form.Field>
            {hasTriedSubmit && fieldErrors.mood?.[0] ? (
              <Text style={styles.errorText}>{fieldErrors.mood[0]}</Text>
            ) : null}

            <form.Field name="notes">
              {(field) => (
                <Input
                  label="Notes"
                  minRows={4}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  placeholder="Add a few details you want to remember..."
                  value={field.state.value}
                  variant="textarea"
                />
              )}
            </form.Field>
            {hasTriedSubmit && fieldErrors.notes?.[0] ? (
              <Text style={styles.errorText}>{fieldErrors.notes[0]}</Text>
            ) : null}

            <AddImageField
              color={sectionColors.events}
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
                disabled={isUploading || isSaving}
                onPress={() => {
                  setSaveError(null);
                  void startUpload(failedUploads);
                }}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed ? styles.retryButtonPressed : null,
                  isUploading || isSaving ? styles.retryButtonDisabled : null,
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
                <ActivityIndicator color={sectionColors.events} />
                <Text style={styles.submittingText}>Saving event...</Text>
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
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.sm,
  },
  moodChip: {
    width: '48%',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: sectionColors.events,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  retryButtonText: {
    color: sectionColors.events,
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
