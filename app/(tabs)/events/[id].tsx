import Divider from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useDeleteEventMutation, useEventDetailQuery } from '@/hooks/useEvents';
import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CalendarDays,
  ChevronLeft,
  Ellipsis,
  MapPin,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const ITEM_WIDTH = 110;
const COLUMNS = 3;

const FALLBACK_COVER_IMAGE = require('../../../assets/images/fallbackImage.png');

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

export default function EventDetailScreen() {
  const { width } = useWindowDimensions();
  const { activeGroup, isLoading: isLoadingGroups } = useActiveGroup();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const deleteEventMutation = useDeleteEventMutation();
  const eventQuery = useEventDetailQuery(eventId, activeGroup?.id);
  const event = eventQuery.data;
  const displayDate = event?.occurredOn
    ? formatOccurredOn(event.occurredOn)
    : '';
  const heroImageUrl = event?.photos[0]?.url ?? null;
  const heroImageSource = heroImageUrl
    ? { uri: heroImageUrl }
    : FALLBACK_COVER_IMAGE;
  const photoThumbs = event?.photos.slice(0, 3) ?? [];
  const loadError =
    eventQuery.error instanceof Error
      ? eventQuery.error.message
      : eventQuery.error
        ? 'Could not load event.'
        : null;
  const hasNotes = Boolean(event?.notes?.trim());
  const isDeleting = deleteEventMutation.isPending;

  const removeEvent = async () => {
    if (!eventId || !activeGroup?.id) {
      return;
    }

    try {
      await deleteEventMutation.mutateAsync({
        eventId,
        groupId: activeGroup.id,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        'Could not delete event',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const handleEdit = () => {
    setIsMenuOpen(false);

    if (!eventId) {
      return;
    }

    router.push(`/events/new?eventId=${encodeURIComponent(eventId)}`);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);

    if (!eventId || !activeGroup?.id || isDeleting) {
      return;
    }

    Alert.alert(
      'Delete event?',
      'This event and its photos will be removed permanently.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeEvent();
          },
        },
      ],
    );
  };

  if (isLoadingGroups || eventQuery.isPending) {
    return (
      <View style={styles.screenCentered}>
        <ActivityIndicator color={sectionColors.events} />
      </View>
    );
  }

  if (!eventId || loadError || !event) {
    return (
      <View style={styles.screenCentered}>
        <Text style={styles.errorText}>{loadError ?? 'Event not found.'}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backTextButton}
        >
          <Text style={styles.backText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const horizontalPadding = 16 * 2; // same as your container paddingHorizontal
  const availableWidth = width - horizontalPadding;
  const gap = (availableWidth - ITEM_WIDTH * COLUMNS) / COLUMNS;

  return (
    <View style={styles.screen}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image
            contentFit="cover"
            source={heroImageSource}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />

          <Pressable
            accessibilityHint="Returns to the events list"
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                top: space.lg,
              },
            ]}
          >
            <ChevronLeft color={baseColors.text} size={22} />
          </Pressable>

          <Pressable
            accessibilityHint="Opens event actions"
            accessibilityLabel="More options"
            accessibilityRole="button"
            disabled={isDeleting}
            onPress={() => setIsMenuOpen(true)}
            style={[
              styles.menuButton,
              {
                top: space.lg,
              },
              isDeleting ? styles.menuButtonDisabled : null,
            ]}
          >
            <Ellipsis color={baseColors.text} size={22} />
          </Pressable>

          {event.mood ? (
            <View style={styles.moodPill}>
              <Text style={styles.moodPillText}>{event.mood}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bodyCard}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.metaStack}>
            <View style={styles.metaRow}>
              <CalendarDays color={sectionColors.events} size={14} />
              <Text style={styles.dateText}>{displayDate}</Text>
            </View>

            {event.locationText ? (
              <View style={styles.metaRow}>
                <MapPin color={baseColors.textSoft} size={14} />
                <Text style={styles.locationText}>{event.locationText}</Text>
              </View>
            ) : null}
          </View>

          <Divider color={sectionColors.events} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Mood</Text>
            <Text style={styles.sectionBody}>
              {event.mood ?? 'No mood added'}
            </Text>
          </View>

          {hasNotes ? (
            <>
              <Divider color={sectionColors.events} />

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Notes</Text>
                <Text style={styles.sectionBody}>{event.notes}</Text>
              </View>
            </>
          ) : null}

          <Divider color={sectionColors.events} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photos</Text>
            <View style={[styles.photosRow, { gap: gap }]}>
              {Array.from({ length: 6 }).map((_, index) => {
                const photo = photoThumbs[index];

                if (!photo) {
                  return (
                    <View
                      key={`placeholder-${index}`}
                      style={styles.photoPlaceholder}
                    >
                      <Text style={styles.photoPlaceholderText}>+</Text>
                    </View>
                  );
                }

                return (
                  <View key={photo.storagePath} style={styles.photoThumbWrap}>
                    <Image
                      contentFit="cover"
                      source={{ uri: photo.url }}
                      style={styles.photoThumb}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
        transparent
        visible={isMenuOpen}
      >
        <View style={styles.menuOverlay}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsMenuOpen(false)}
            style={styles.menuBackdrop}
          />
          <View style={styles.menuPanel}>
            <Pressable
              accessibilityRole="button"
              onPress={handleEdit}
              style={({ pressed }) => [
                styles.menuAction,
                pressed ? styles.menuActionPressed : null,
              ]}
            >
              <Text style={styles.menuActionText}>Edit event</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              accessibilityRole="button"
              disabled={isDeleting}
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.menuAction,
                pressed ? styles.menuActionPressed : null,
                isDeleting ? styles.menuActionDisabled : null,
              ]}
            >
              <Text style={styles.menuActionDangerText}>
                {isDeleting ? 'Deleting...' : 'Delete event'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  screenCentered: {
    flex: 1,
    backgroundColor: baseColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  heroWrap: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    height: 320,
    width: '100%',
  },
  heroOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    left: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuButton: {
    position: 'absolute',
    right: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuButtonDisabled: {
    opacity: 0.45,
  },
  moodPill: {
    alignItems: 'center',
    backgroundColor: sectionColors.events,
    borderRadius: radius.full,
    bottom: space.xl + space.xxs,
    height: 32,
    justifyContent: 'center',
    left: space.lg,
    paddingHorizontal: 14,
    position: 'absolute',
  },
  moodPillText: {
    color: baseColors.bg,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
  bodyCard: {
    backgroundColor: baseColors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: space.lg + space.xs,
    marginTop: -space.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.xl,
  },
  title: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.xxl,
    lineHeight: textTheme.lineHeight.xl,
  },
  metaStack: {
    gap: 6,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  dateText: {
    color: sectionColors.events,
    fontFamily: textTheme.family.mediumItalic,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
  },
  locationText: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  section: {
    gap: space.sm,
  },
  sectionLabel: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    letterSpacing: 0.78,
    textTransform: 'uppercase',
  },
  sectionBody: {
    color: baseColors.text,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  photosRow: {
    flexDirection: 'row',
    flex: 3,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  photoThumbWrap: {
    borderRadius: 14,
    height: 111,
    overflow: 'hidden',
    width: 111,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },

  photoPlaceholder: {
    width: 111,
    height: 111,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(107, 101, 96, 0.27)',
    backgroundColor: baseColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: baseColors.textMuted,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.sm,
    lineHeight: 33,
  },
  menuOverlay: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuPanel: {
    position: 'absolute',
    right: space.lg,
    top: space.lg + 48,
    minWidth: 168,
    backgroundColor: baseColors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(107, 101, 96, 0.16)',
    overflow: 'hidden',
  },
  menuAction: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  menuActionPressed: {
    opacity: 0.82,
  },
  menuActionDisabled: {
    opacity: 0.45,
  },
  menuActionText: {
    color: baseColors.text,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  menuActionDangerText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(107, 101, 96, 0.12)',
  },
  errorText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    textAlign: 'center',
  },
  backTextButton: {
    marginTop: space.lg,
  },
  backText: {
    color: sectionColors.events,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
});
