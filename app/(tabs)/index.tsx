import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useTimelineItemsQuery } from '@/hooks/useTimelineItems';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { type Href, Link } from 'expo-router';
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

function resolveTimelineHref(item: {
  kind?: 'event' | 'moment' | null;
  sourceId?: string;
}): Href | null {
  if (!item.sourceId) {
    return null;
  }

  if (item.kind === 'event') {
    return `/events/${item.sourceId}` as Href;
  }

  if (item.kind === 'moment') {
    return `/moments/${item.sourceId}` as Href;
  }

  return null;
}

export default function TimelineScreen() {
  const {
    activeGroup,
    errorMessage: groupError,
    isLoading: isLoadingGroups,
  } = useActiveGroup();
  const timelineQuery = useTimelineItemsQuery(activeGroup?.id);
  const pageColor = sectionColors.timeline;
  const timelineItems = timelineQuery.data ?? [];
  const loadError =
    groupError ??
    (timelineQuery.error instanceof Error
      ? timelineQuery.error.message
      : timelineQuery.error
        ? 'Failed to load timeline items.'
        : null);
  const activeGroupLabel =
    activeGroup?.groupKind === 'personal'
      ? 'Personal'
      : (activeGroup?.name ?? 'this space');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.timeline}></View>
        <View style={[styles.memoriesContainer]}>
          {isLoadingGroups || timelineQuery.isPending ? (
            <ActivityIndicator color={sectionColors.timeline} />
          ) : null}

          {!isLoadingGroups && !timelineQuery.isPending && loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : null}

          {!isLoadingGroups &&
          !timelineQuery.isPending &&
          !loadError &&
          timelineItems.length === 0 ? (
            <Text style={styles.emptyText}>
              No timeline items in {activeGroupLabel} yet.
            </Text>
          ) : null}

          {!isLoadingGroups && !timelineQuery.isPending && !loadError
            ? timelineItems.map((item) => {
                const href = resolveTimelineHref(item);
                const card = (
                  <Card
                    variant="default"
                    title={item.title}
                    date={formatOccurredOn(item.occurredOn)}
                    coverImage={item.coverImage ?? FALLBACK_COVER_IMAGE}
                    color={pageColor}
                    description={item.description}
                    type={item.displayType}
                  />
                );

                return (
                  <View style={styles.itemWrap} key={item.id}>
                    <View style={styles.indicator}></View>
                    {href ? (
                      <Link asChild href={href}>
                        <Pressable
                          accessibilityHint="Opens this timeline item"
                          accessibilityRole="button"
                        >
                          {card}
                        </Pressable>
                      </Link>
                    ) : (
                      card
                    )}
                  </View>
                );
              })
            : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    paddingBottom: space.xl,
    paddingHorizontal: space.xl,
  },
  timeline: {
    height: '100%',
    width: 2,
    backgroundColor: sectionColors.timeline,
    opacity: 0.4,
  },
  indicator: {
    height: 10,
    aspectRatio: 1 / 1,
    backgroundColor: sectionColors.timeline,
    borderRadius: 5,
    boxShadow: `0px 0px 8px 0px ${sectionColors.timeline}`,
    position: 'absolute',
    top: 20,
    left: -space.lg,
    transform: [{ translateX: -6 }],
  },

  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: baseColors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.lg,
  },

  memoriesContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.lg,
    width: '100%',
  },
  itemWrap: {
    position: 'relative',
    width: '100%',
  },
  emptyText: {
    color: baseColors.textSoft,
    textAlign: 'center',
  },
  errorText: {
    color: baseColors.textError,
    textAlign: 'center',
  },
  link: {},
});
