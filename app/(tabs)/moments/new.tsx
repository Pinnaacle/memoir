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
import { createMoment } from '@/lib/moments';
import {
  type CreateMomentValues,
  createMomentSchema,
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
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SAVE_TIMEOUT_MS = 10000;

//Timeout for failed submissions
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

export default function NewMomentScreen() {
  const [photos, setPhotos] = useState<SelectedImage[]>([]);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const momentTypeOptions = [
    { label: 'Food', value: 'food' },
    { label: 'Outfit', value: 'outfit' },
    { label: 'Tiny Joy', value: 'tiny-joy' },
    { label: 'Cozy Scene', value: 'cozy-scene' },
    { label: 'Nature', value: 'nature' },
    { label: 'Connection', value: 'connection' },
    { label: 'Personal Win', value: 'personal-win' },
  ];

  const form = useForm({
    defaultValues: {
      momentType: '',
      title: '',
      description: '',
      occurredAt: new Date(),
    } satisfies CreateMomentValues,
    onSubmit: async ({ value }) => {
      const parsed = createMomentSchema.safeParse(value);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      }

      try {
        await withTimeout(
          createMoment({
            ...parsed.data,
            photos,
          }),
          SAVE_TIMEOUT_MS,
        );
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
    const parsed = createMomentSchema.safeParse(form.state.values);
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
        setSaveError('Failed to save moment. Please try again.');
      }
    } finally {
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
          color={sectionColors.moments}
          onClose={() => router.back()}
          onSave={handleSave}
          title="New Moment"
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
                  options={momentTypeOptions}
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
              onChange={setPhotos}
              value={photos}
            />

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
  dropdownField: {
    gap: space.sm,
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
