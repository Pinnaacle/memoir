import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { listMomentsForCurrentUser, type MomentListItem } from '@/lib/moments';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text } from '@/theme/type';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
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
  const [moments, setMoments] = useState<MomentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMoments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const rows = await listMomentsForCurrentUser();
      setMoments(rows);
    } catch (error) {
      if (error instanceof Error) {
        setLoadError(error.message);
      } else {
        setLoadError('Failed to load moments.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMoments();
    }, [loadMoments]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator
            color={sectionColors.moments}
            style={styles.loader}
          />
        ) : null}

        {!isLoading && loadError ? (
          <Text style={styles.errorText}>{loadError}</Text>
        ) : null}

        {!isLoading && !loadError && moments.length === 0 ? (
          <Text style={styles.emptyText}>
            No moments yet. Tap + to create your first one.
          </Text>
        ) : null}

        {!isLoading && !loadError
          ? moments.map((moment) => (
              <Card
                key={moment.id}
                color={sectionColors.moments}
                coverImage={moment.coverImage ?? FALLBACK_COVER_IMAGE}
                date={formatOccurredOn(moment.occurredOn)}
                description={moment.description ?? ''}
                title={moment.title}
                type={formatMomentType(moment.category)}
                variant="default"
              />
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
    borderRadius: 999,
    bottom: 96,
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
