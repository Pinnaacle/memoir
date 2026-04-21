import { Card } from '@/components/ui/Card';
import Header from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { useEventsQuery } from '@/hooks/useEvents';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text } from '@/theme/type';
import { type Href, Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
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

export default function EventsIndexScreen() {
  const eventsQuery = useEventsQuery();

  const events = eventsQuery.data ?? [];
  const loadError =
    eventsQuery.error instanceof Error
      ? eventsQuery.error.message
      : eventsQuery.error
        ? 'Failed to load events.'
        : null;

  return (
    <View style={styles.container}>
      <Header
        title="Events"
        color={sectionColors.events}
        tagLine="Insert very meaningful text here"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {eventsQuery.isPending ? (
          <ActivityIndicator
            color={sectionColors.events}
            style={styles.loader}
          />
        ) : null}

        {!eventsQuery.isPending && loadError ? (
          <Text style={styles.errorText}>{loadError}</Text>
        ) : null}

        {!eventsQuery.isPending && !loadError && events.length === 0 ? (
          <Text style={styles.emptyText}>
            No events yet. Tap + to create your first one.
          </Text>
        ) : null}

        {!eventsQuery.isPending && !loadError
          ? events.map((event) => (
              <Link asChild href={`/events/${event.id}` as Href} key={event.id}>
                <Pressable
                  accessibilityHint="Opens this event"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.cardPressable,
                    pressed ? styles.cardPressed : null,
                  ]}
                >
                  <Card
                    color={sectionColors.events}
                    coverImage={event.coverImage ?? FALLBACK_COVER_IMAGE}
                    date={formatOccurredOn(event.occurredOn)}
                    location={event.locationText ?? 'No location added'}
                    title={event.title}
                    type={event.mood ?? 'No mood set'}
                    variant="compressed"
                  />
                </Pressable>
              </Link>
            ))
          : null}
      </ScrollView>

      <Link href="/events/new" asChild>
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
  scrollView: {
    flex: 1,
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
    backgroundColor: sectionColors.events,
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
