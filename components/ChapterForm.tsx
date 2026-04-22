import { DatePicker } from '@/components/DatePicker';
import ModalTopBar from '@/components/ModalTopBar';
import Divider from '@/components/ui/Divider';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import {
  useCreateChapterMutation,
  useUpdateChapterMutation,
} from '@/hooks/useChapters';
import { useEventsQuery } from '@/hooks/useEvents';
import { useMomentsQuery } from '@/hooks/useMoments';
import { parseLocalDate } from '@/lib/date';
import {
  type CreateChapterValues,
  createChapterSchema,
} from '@/lib/validation/chapter';
import type { ChapterItemInput, ChapterItemKind } from '@/services/chapters';
import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { useForm } from '@tanstack/react-form';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
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

const FALLBACK_COVER_IMAGE = require('../assets/images/fallbackImage.png');

function formatShortDate(value: string): string {
  const date = parseLocalDate(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function makeItemKey(kind: ChapterItemKind, id: string) {
  return `${kind}:${id}`;
}

type SelectableSource = {
  id: string;
  title: string;
  occurredOn: string;
  coverImage?: string;
};

type SelectableItem = SelectableSource & {
  kind: ChapterItemKind;
};

function toSelectableItem(
  kind: ChapterItemKind,
  source: SelectableSource,
): SelectableItem {
  return {
    kind,
    id: source.id,
    title: source.title,
    occurredOn: source.occurredOn,
    coverImage: source.coverImage,
  };
}

export type ChapterInitialSelection = {
  kind: ChapterItemKind;
  id: string;
};

type ChapterFormBaseProps = {
  activeGroupId: string | null;
  initialValues: CreateChapterValues;
  initialSelection: ChapterInitialSelection[];
};

export type ChapterFormProps =
  | (ChapterFormBaseProps & { isEdit: false })
  | (ChapterFormBaseProps & { isEdit: true; chapterId: string });

const chapterTypeOptions = [
  { label: 'Vacation', value: 'vacation' },
  { label: 'Trip', value: 'trip' },
  { label: 'Project', value: 'project' },
  { label: 'Season', value: 'season' },
  { label: 'Milestone', value: 'milestone' },
  { label: 'Celebration', value: 'celebration' },
  { label: 'Miscellaneous', value: 'miscellaneous' },
];

export default function ChapterForm(props: ChapterFormProps) {
  const { activeGroupId, initialValues, initialSelection, isEdit } = props;
  const initialKeys = useMemo(
    () => initialSelection.map((entry) => makeItemKey(entry.kind, entry.id)),
    [initialSelection],
  );
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(initialKeys),
  );
  const [selectionOrder, setSelectionOrder] = useState<string[]>(
    () => [...initialKeys],
  );
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const createChapterMutation = useCreateChapterMutation();
  const updateChapterMutation = useUpdateChapterMutation();
  const momentsQuery = useMomentsQuery(activeGroupId ?? undefined);
  const eventsQuery = useEventsQuery(activeGroupId ?? undefined);

  const moments = momentsQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const isLoadingItems = momentsQuery.isPending || eventsQuery.isPending;
  const itemsLoadError =
    momentsQuery.error instanceof Error
      ? momentsQuery.error.message
      : eventsQuery.error instanceof Error
        ? eventsQuery.error.message
        : null;

  const itemsByKey = useMemo(() => {
    const map = new Map<string, SelectableItem>();
    for (const moment of moments) {
      map.set(
        makeItemKey('moment', moment.id),
        toSelectableItem('moment', moment),
      );
    }
    for (const event of events) {
      map.set(
        makeItemKey('event', event.id),
        toSelectableItem('event', event),
      );
    }
    return map;
  }, [events, moments]);

  const selectedCount = selectedKeys.size;

  const saveChapter = async (
    values: CreateChapterValues,
    groupId: string,
    items: ChapterItemInput[],
  ) => {
    if (props.isEdit) {
      await updateChapterMutation.mutateAsync({
        ...values,
        chapterId: props.chapterId,
        groupId,
        items,
      });
      return;
    }

    await createChapterMutation.mutateAsync({
      ...values,
      groupId,
      items,
    });
  };

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      const parsed = createChapterSchema.safeParse(value);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      }

      if (!activeGroupId) {
        throw new Error('Choose a space before saving this chapter.');
      }

      const items: ChapterItemInput[] = selectionOrder
        .map((key) => itemsByKey.get(key))
        .filter((item): item is SelectableItem => Boolean(item))
        .map((item) => ({ kind: item.kind, id: item.id }));

      if (items.length === 0) {
        throw new Error(
          'Pick at least one moment or event to bundle into this chapter.',
        );
      }

      try {
        await saveChapter(parsed.data, activeGroupId, items);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to save chapter. Please try again.');
      }

      router.back();
    },
  });

  const validation = useMemo(
    () => createChapterSchema.safeParse(form.state.values),
    [form.state.values],
  );
  const fieldErrors = validation.success
    ? {}
    : validation.error.flatten().fieldErrors;
  const submitError = saveError ?? form.state.errorMap.onSubmit;

  function toggleItem(item: SelectableItem) {
    const key = makeItemKey(item.kind, item.id);
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setSelectionOrder((current) => {
      if (current.includes(key)) {
        return current.filter((existing) => existing !== key);
      }
      return [...current, key];
    });
    setItemsError(null);
  }

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setHasTriedSubmit(true);
    setSaveError(null);
    setItemsError(null);
    const parsed = createChapterSchema.safeParse(form.state.values);
    if (!parsed.success) {
      return;
    }

    if (!activeGroupId) {
      setSaveError('Choose a space before saving this chapter.');
      return;
    }

    if (selectedKeys.size === 0) {
      setItemsError(
        'Pick at least one moment or event to bundle into this chapter.',
      );
      return;
    }

    setIsSaving(true);

    try {
      await form.handleSubmit();
    } catch (error) {
      if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError('Failed to save chapter. Please try again.');
      }
      setIsSaving(false);
    }
  };

  const hasAnyItems = moments.length > 0 || events.length > 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ModalTopBar
          color={sectionColors.chapters}
          onClose={() => router.back()}
          onSave={handleSave}
          title={isEdit ? 'Edit Chapter' : 'New Chapter'}
        />
        <Divider color={sectionColors.chapters} />

        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <form.Field name="chapterType">
              {(field) => (
                <Dropdown
                  color={sectionColors.chapters}
                  onChange={field.handleChange}
                  options={chapterTypeOptions}
                  placeholder="Chapter type"
                  value={field.state.value || undefined}
                />
              )}
            </form.Field>
            {hasTriedSubmit && fieldErrors.chapterType?.[0] ? (
              <Text style={styles.errorText}>{fieldErrors.chapterType[0]}</Text>
            ) : null}

            <form.Field name="title">
              {(field) => (
                <Input
                  label="Title"
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                  placeholder="Name this chapter of your story..."
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
                  color={sectionColors.chapters}
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
                  placeholder="What ties these memories together?"
                  value={field.state.value}
                  variant="textarea"
                />
              )}
            </form.Field>
            {hasTriedSubmit && fieldErrors.description?.[0] ? (
              <Text style={styles.errorText}>{fieldErrors.description[0]}</Text>
            ) : null}

            <View style={styles.selectionSection}>
              <View style={styles.selectionHeader}>
                <Text style={styles.selectionLabel}>Memories</Text>
                {selectedCount > 0 ? (
                  <Text style={styles.selectionCount}>
                    {selectedCount} selected
                  </Text>
                ) : null}
              </View>
              <Text style={styles.selectionHint}>
                Pull existing moments and events into this chapter.
              </Text>

              {isLoadingItems ? (
                <ActivityIndicator
                  color={sectionColors.chapters}
                  style={styles.sectionLoader}
                />
              ) : null}

              {itemsLoadError ? (
                <Text style={styles.errorText}>{itemsLoadError}</Text>
              ) : null}

              {!isLoadingItems && !itemsLoadError && !hasAnyItems ? (
                <Text style={styles.selectionEmpty}>
                  No moments or events to bundle yet. Create a few first, then
                  come back.
                </Text>
              ) : null}

              {!isLoadingItems ? (
                <SelectableGroup
                  kind="moment"
                  label="Moments"
                  onToggle={toggleItem}
                  selectedKeys={selectedKeys}
                  sources={moments}
                />
              ) : null}

              {!isLoadingItems ? (
                <SelectableGroup
                  kind="event"
                  label="Events"
                  onToggle={toggleItem}
                  selectedKeys={selectedKeys}
                  sources={events}
                />
              ) : null}

              {hasTriedSubmit && itemsError ? (
                <Text style={styles.errorText}>{itemsError}</Text>
              ) : null}
            </View>

            {submitError ? (
              <Text style={styles.errorText}>{submitError}</Text>
            ) : null}

            {isSaving ? (
              <View style={styles.submittingRow}>
                <ActivityIndicator color={sectionColors.chapters} />
                <Text style={styles.submittingText}>
                  {isEdit ? 'Saving changes...' : 'Saving chapter...'}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type SelectableGroupProps = {
  kind: ChapterItemKind;
  label: string;
  onToggle: (item: SelectableItem) => void;
  selectedKeys: Set<string>;
  sources: SelectableSource[];
};

function SelectableGroup({
  kind,
  label,
  onToggle,
  selectedKeys,
  sources,
}: SelectableGroupProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.groupList}>
        {sources.map((source) => {
          const item = toSelectableItem(kind, source);
          const key = makeItemKey(kind, source.id);
          return (
            <SelectableRow
              item={item}
              key={key}
              onToggle={onToggle}
              selected={selectedKeys.has(key)}
            />
          );
        })}
      </View>
    </View>
  );
}

type SelectableRowProps = {
  item: SelectableItem;
  selected: boolean;
  onToggle: (item: SelectableItem) => void;
};

function SelectableRow({ item, onToggle, selected }: SelectableRowProps) {
  return (
    <Pressable
      accessibilityHint="Toggles this memory for the chapter"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onToggle(item)}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.rowSelected : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.thumbWrap}>
        <Image
          contentFit="cover"
          source={
            item.coverImage ? { uri: item.coverImage } : FALLBACK_COVER_IMAGE
          }
          style={styles.thumbImage}
        />
      </View>

      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {item.title}
        </Text>
        <Text style={styles.rowMeta}>{formatShortDate(item.occurredOn)}</Text>
      </View>

      <View
        style={[styles.checkbox, selected ? styles.checkboxSelected : null]}
      >
        {selected ? (
          <Check color={baseColors.bg} size={14} strokeWidth={3} />
        ) : null}
      </View>
    </Pressable>
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
  selectionSection: {
    gap: space.md,
  },
  selectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectionLabel: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.md,
  },
  selectionCount: {
    color: sectionColors.chapters,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
  },
  selectionHint: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
  },
  selectionEmpty: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    paddingVertical: space.md,
    textAlign: 'center',
  },
  sectionLoader: {
    marginVertical: space.md,
  },
  group: {
    gap: space.sm,
  },
  groupLabel: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.xs,
    letterSpacing: 0.78,
    lineHeight: textTheme.lineHeight.xs,
    textTransform: 'uppercase',
  },
  groupList: {
    gap: space.xs,
  },
  row: {
    alignItems: 'center',
    backgroundColor: baseColors.card,
    borderColor: 'transparent',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.md,
    padding: space.sm,
  },
  rowSelected: {
    borderColor: sectionColors.chapters,
  },
  rowPressed: {
    opacity: 0.9,
  },
  thumbWrap: {
    borderRadius: radius.md,
    height: 44,
    overflow: 'hidden',
    width: 44,
  },
  thumbImage: {
    height: '100%',
    width: '100%',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  rowMeta: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: baseColors.textMuted,
    borderRadius: radius.full,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxSelected: {
    backgroundColor: sectionColors.chapters,
    borderColor: sectionColors.chapters,
  },
});
