import ChapterForm, {
  type ChapterInitialSelection,
} from '@/components/ChapterForm';
import ModalTopBar from '@/components/ModalTopBar';
import Divider from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useChapterDetailQuery } from '@/hooks/useChapters';
import { parseLocalDate } from '@/lib/date';
import { type CreateChapterValues } from '@/lib/validation/chapter';
import type { ChapterDetail } from '@/services/chapters';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import {
  router,
  useGlobalSearchParams,
  useLocalSearchParams,
} from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMPTY_VALUES: CreateChapterValues = {
  chapterType: '',
  title: '',
  description: '',
  occurredAt: new Date(),
};

function getParamValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getInitialValues(chapter: ChapterDetail): CreateChapterValues {
  return {
    chapterType: chapter.chapterType ?? '',
    title: chapter.title,
    description: chapter.description ?? '',
    occurredAt: parseLocalDate(chapter.occurredOn),
  };
}

function getInitialSelection(
  chapter: ChapterDetail,
): ChapterInitialSelection[] {
  return chapter.entries.map((entry) => ({
    kind: entry.kind,
    id: entry.id,
  }));
}

function getLoadError(options: {
  activeGroupId: string | null | undefined;
  error: unknown;
  hasChapter: boolean;
  isEdit: boolean;
  isLoadingGroups: boolean;
  isChapterPending: boolean;
}): string | null {
  const {
    activeGroupId,
    error,
    hasChapter,
    isEdit,
    isLoadingGroups,
    isChapterPending,
  } = options;

  if (!isEdit) {
    return null;
  }

  if (!isLoadingGroups && !activeGroupId) {
    return 'Choose a space before editing this chapter.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error) {
    return 'Could not load chapter.';
  }

  if (!isLoadingGroups && !isChapterPending && !hasChapter) {
    return 'Chapter not found.';
  }

  return null;
}

export default function NewChapterScreen() {
  const { activeGroup, isLoading: isLoadingGroups } = useActiveGroup();
  const localParams = useLocalSearchParams<{
    chapterId?: string | string[];
    id?: string | string[];
  }>();
  const globalParams = useGlobalSearchParams<{
    chapterId?: string | string[];
    id?: string | string[];
  }>();
  const chapterId = getParamValue(
    localParams.chapterId ??
      globalParams.chapterId ??
      localParams.id ??
      globalParams.id,
  );
  const isEdit = Boolean(chapterId);
  const chapterQuery = useChapterDetailQuery(chapterId, activeGroup?.id);
  const chapter = chapterQuery.data;
  const isLoadingChapter =
    isEdit && (isLoadingGroups || chapterQuery.isPending);
  const loadError = getLoadError({
    activeGroupId: activeGroup?.id,
    error: chapterQuery.error,
    hasChapter: Boolean(chapter),
    isEdit,
    isLoadingGroups,
    isChapterPending: chapterQuery.isPending,
  });

  if (isLoadingChapter) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ModalTopBar
            color={sectionColors.chapters}
            onClose={() => router.back()}
            title="Edit Chapter"
          />
          <Divider color={sectionColors.chapters} />
          <View style={styles.loadingState}>
            <ActivityIndicator color={sectionColors.chapters} />
            <Text style={styles.submittingText}>Loading chapter...</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ModalTopBar
            color={sectionColors.chapters}
            onClose={() => router.back()}
            title="Edit Chapter"
          />
          <Divider color={sectionColors.chapters} />
          <View style={styles.loadingState}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const initialValues = chapter ? getInitialValues(chapter) : EMPTY_VALUES;
  const initialSelection = chapter ? getInitialSelection(chapter) : [];
  const groupKey = activeGroup?.id ?? 'no-group';

  if (isEdit && chapterId) {
    return (
      <ChapterForm
        activeGroupId={activeGroup?.id ?? null}
        chapterId={chapterId}
        initialSelection={initialSelection}
        initialValues={initialValues}
        isEdit
        key={`${chapterId}:${groupKey}`}
      />
    );
  }

  return (
    <ChapterForm
      activeGroupId={activeGroup?.id ?? null}
      initialSelection={initialSelection}
      initialValues={initialValues}
      isEdit={false}
      key={`new:${groupKey}`}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  errorText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
    marginTop: -space.md,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    gap: space.sm,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  submittingText: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
});
