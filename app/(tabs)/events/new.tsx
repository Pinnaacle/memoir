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
import { useCreateEventMutation } from '@/hooks/useEvents';
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
  const [photos, setPhotos] = useState<SelectedImage[]>([]);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const createEventMutation = useCreateEventMutation();

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

      try {
        await createEventMutation.mutateAsync({
          ...parsed.data,
          photos,
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
              onChange={setPhotos}
              value={photos}
            />

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
});
