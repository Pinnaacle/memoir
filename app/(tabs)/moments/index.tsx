import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
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
  View,
} from 'react-native';

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
  const momentsQuery = useMomentsQuery();
  const moments = momentsQuery.data ?? [];
  const loadError =
    momentsQuery.error instanceof Error
      ? momentsQuery.error.message
      : momentsQuery.error
        ? 'Failed to load moments.'
        : null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {momentsQuery.isPending ? (
            <ActivityIndicator
              color={sectionColors.moments}
              style={styles.loader}
            />
          ) : null}

          {!momentsQuery.isPending && loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : null}

          {!momentsQuery.isPending && !loadError && moments.length === 0 ? (
            <Text style={styles.emptyText}>
              No moments yet. Tap + to create your first one.
            </Text>
          ) : null}

          {!momentsQuery.isPending && !loadError
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
        </View>
      </ScrollView>
      <Link href="/moments/new" asChild>
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
    paddingTop: space.xl,
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
