import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useChaptersQuery } from '@/hooks/useChapters';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text } from '@/theme/type';
import { type Href, Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

function formatOccurredOn(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatChapterType(value: string | null): string {
  if (!value) {
    return 'Chapter';
  }

  return value
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export default function ChaptersScreen() {
  const {
    activeGroup,
    errorMessage: groupError,
    isLoading: isLoadingGroups,
  } = useActiveGroup();
  const chaptersQuery = useChaptersQuery(activeGroup?.id);
  const chapters = chaptersQuery.data ?? [];
  const loadError =
    groupError ??
    (chaptersQuery.error instanceof Error
      ? chaptersQuery.error.message
      : chaptersQuery.error
        ? 'Failed to load chapters.'
        : null);
  const activeGroupLabel =
    activeGroup?.groupKind === 'personal'
      ? 'Personal'
      : (activeGroup?.name ?? 'this space');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {isLoadingGroups || chaptersQuery.isPending ? (
            <ActivityIndicator
              color={sectionColors.chapters}
              style={styles.loader}
            />
          ) : null}

          {!isLoadingGroups && !chaptersQuery.isPending && loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : null}

          {!isLoadingGroups &&
          !chaptersQuery.isPending &&
          !loadError &&
          chapters.length === 0 ? (
            <Text style={styles.emptyText}>
              No chapters in {activeGroupLabel} yet. Tap + to pull moments and
              events into your first one.
            </Text>
          ) : null}

          {!isLoadingGroups && !chaptersQuery.isPending && !loadError
            ? chapters.map((chapter) => (
                <Link
                  asChild
                  href={`/chapters/${chapter.id}` as Href}
                  key={chapter.id}
                >
                  <Pressable
                    accessibilityHint="Opens this chapter"
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.cardPressable,
                      pressed ? styles.cardPressed : null,
                    ]}
                  >
                    <Card
                      color={sectionColors.chapters}
                      date={formatOccurredOn(chapter.occurredOn)}
                      description={chapter.description ?? undefined}
                      images={chapter.images}
                      occurredOn={chapter.occurredOn}
                      title={chapter.title}
                      type={formatChapterType(chapter.chapterType)}
                      variant="detailed"
                    />
                  </Pressable>
                </Link>
              ))
            : null}
        </View>
      </ScrollView>
      <Link href={'/chapters/new' as Href} asChild>
        <Pressable accessibilityRole="button" style={styles.createButton}>
          <Plus color={baseColors.bg} size={28} strokeWidth={2.4} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    gap: space.md + space.xs,
    paddingHorizontal: space.lg,
    paddingBottom: 110,
  },
  loader: {
    marginTop: space.xl,
  },
  cardPressable: {
    borderRadius: 26,
  },
  cardPressed: {
    opacity: 0.92,
  },
  emptyText: {
    color: baseColors.textSoft,
    fontFamily: text.family.regular,
    fontSize: text.size.md,
    lineHeight: text.lineHeight.md,
    marginTop: space.xl,
    textAlign: 'center',
  },
  errorText: {
    color: baseColors.textError,
    fontFamily: text.family.medium,
    fontSize: text.size.sm,
    lineHeight: text.lineHeight.sm,
    marginTop: space.xl,
    textAlign: 'center',
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: sectionColors.chapters,
    borderRadius: 999,
    bottom: 20,
    height: 60,
    width: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: space.xl,
    shadowColor: baseColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
});
