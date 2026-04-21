import { Card } from '@/components/ui/Card';
import Header from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
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
  const { activeGroup, errorMessage: groupError, isLoading: isLoadingGroups } =
    useActiveGroup();
  const eventsQuery = useEventsQuery(activeGroup?.id);

  const events = eventsQuery.data ?? [];
  const loadError =
    groupError ??
    (eventsQuery.error instanceof Error
      ? eventsQuery.error.message
      : eventsQuery.error
        ? 'Failed to load events.'
        : null);
  const activeGroupLabel =
    activeGroup?.groupKind === 'personal'
      ? 'Personal'
      : activeGroup?.name ?? 'this space';

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
        {isLoadingGroups || eventsQuery.isPending ? (
          <ActivityIndicator
            color={sectionColors.events}
            style={styles.loader}
          />
        ) : null}

        {!isLoadingGroups && !eventsQuery.isPending && loadError ? (
          <Text style={styles.errorText}>{loadError}</Text>
        ) : null}

        {!isLoadingGroups && !eventsQuery.isPending && !loadError && events.length === 0 ? (
          <Text style={styles.emptyText}>
            No events in {activeGroupLabel} yet. Tap + to create your first
            one.
          </Text>
        ) : null}

        {!isLoadingGroups && !eventsQuery.isPending && !loadError
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
