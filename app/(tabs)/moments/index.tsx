import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useMomentsQuery } from '@/hooks/useMoments';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FALLBACK_COVER_IMAGE = require('@/assets/images/fallbackImage.png');

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

function formatMomentType(value: string | null): string {
  if (!value) {
    return 'Moment';
  }

  return value
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export default function MomentsScreen() {
  const { activeGroup, errorMessage: groupError, isLoading: isLoadingGroups } =
    useActiveGroup();
  const momentsQuery = useMomentsQuery(activeGroup?.id);
  const moments = momentsQuery.data ?? [];
  const loadError =
    groupError ??
    (momentsQuery.error instanceof Error
      ? momentsQuery.error.message
      : momentsQuery.error
        ? 'Failed to load moments.'
        : null);
  const activeGroupLabel =
    activeGroup?.groupKind === 'personal'
      ? 'Personal'
      : activeGroup?.name ?? 'this space';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {isLoadingGroups || momentsQuery.isPending ? (
          <ActivityIndicator
            color={sectionColors.moments}
            style={styles.loader}
          />
        ) : null}

        {!isLoadingGroups && !momentsQuery.isPending && loadError ? (
          <Text style={styles.errorText}>{loadError}</Text>
        ) : null}

        {!isLoadingGroups &&
        !momentsQuery.isPending &&
        !loadError &&
        moments.length === 0 ? (
          <Text style={styles.emptyText}>
            No moments in {activeGroupLabel} yet. Tap + to create your first
            one.
          </Text>
        ) : null}

        {!isLoadingGroups && !momentsQuery.isPending && !loadError
          ? moments.map((moment) => (
              <Link
                asChild
                href={`/moments/${moment.id}` as Href}
                key={moment.id}
              >
                <Pressable
                  accessibilityHint="Opens this moment"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.cardPressable,
                    pressed ? styles.cardPressed : null,
                  ]}
                >
                  <Card
                    color={sectionColors.moments}
                    coverImage={moment.coverImage ?? FALLBACK_COVER_IMAGE}
                    date={formatOccurredOn(moment.occurredOn)}
                    description={moment.description ?? ''}
                    title={moment.title}
                    type={formatMomentType(moment.category)}
                    variant="default"
                  />
                </Pressable>
              </Link>
            ))
          : null}
      </ScrollView>

      <Link href="/moments/new" asChild>
        <Pressable accessibilityRole="button" style={styles.createButton}>
          <Plus color={baseColors.bg} size={28} strokeWidth={2.4} />
        </Pressable>
      </Link>
    </SafeAreaView>
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
    backgroundColor: sectionColors.moments,
    boxShadow: '0px 8px 18px rgba(0, 0, 0, 0.18)',
    borderRadius: 999,
    bottom: 20,
    height: 60,
    width: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: space.xl,
  },
});
