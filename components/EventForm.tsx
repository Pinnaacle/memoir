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
import { useEntryForm } from '@/hooks/useEntryForm';
import {
  useCreateEventMutation,
  useUpdateEventMutation,
} from '@/hooks/useEvents';
import { triggerSelectionFeedback } from '@/lib/interaction';
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
import { useMemo } from 'react';
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

const MOOD_OPTIONS = [
  'Magical',
  'Romantic',
  'Adventurous',
  'Cozy',
  'Spontaneous',
  'Dreamy',
] as const;

export type EventFormProps = {
  activeGroupId: string | null;
  eventId?: string;
  initialPhotos: SelectedImage[];
  initialValues: CreateEventValues;
  isEdit: boolean;
};

export default function EventForm({
  activeGroupId,
  eventId,
  initialPhotos,
  initialValues,
  isEdit,
}: EventFormProps) {
  const createEventMutation = useCreateEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      const parsed = createEventSchema.safeParse(value);

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      }

      if (!activeGroupId) {
        throw new Error('Choose a space before saving this event.');
      }

      if (isEdit && eventId) {
        await updateEventMutation.mutateAsync({
          ...parsed.data,
          eventId,
          groupId: activeGroupId,
          photos: uploadedPhotos,
        });
        return;
      }

      await createEventMutation.mutateAsync({
        ...parsed.data,
        groupId: activeGroupId,
        photos: uploadedPhotos,
      });
    },
  });
  const {
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
  } = useEntryForm({
    bucket: 'events',
    initialPhotos,
    onSaved: () => router.back(),
    saveErrorMessage: 'Failed to save event. Please try again.',
  });

  const validation = useMemo(
    () => createEventSchema.safeParse(form.state.values),
    [form.state.values],
  );
  const fieldErrors = validation.success
    ? {}
    : validation.error.flatten().fieldErrors;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ModalTopBar
          color={sectionColors.events}
          onClose={() => router.back()}
          onSave={() => void handleSave(validation.success, form.handleSubmit)}
          saveDisabled={saveDisabled}
          saveState={saveState}
          title={isEdit ? 'Edit Event' : 'New Event'}
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
                        setIsSelected={() => {
                          if (field.state.value === option) {
                            return;
                          }

                          void triggerSelectionFeedback();
                          field.handleChange(option);
                        }}
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

            {failedUploads.length > 0 ? (
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

            {saveState === 'saving' ? (
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
