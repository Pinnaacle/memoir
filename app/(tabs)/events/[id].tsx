import Divider from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useEventDetailQuery } from '@/hooks/useEvents';
import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, ChevronLeft, MapPin } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const { activeGroup, isLoading: isLoadingGroups } = useActiveGroup();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
  const eventQuery = useEventDetailQuery(eventId, activeGroup?.id);
  const displayDate = eventQuery.data?.occurredOn
    ? formatOccurredOn(eventQuery.data.occurredOn)
    : '';
  const heroImageSource = eventQuery.data?.photos[0]
    ? { uri: eventQuery.data.photos[0] }
    : FALLBACK_COVER_IMAGE;
  const photoThumbs = eventQuery.data?.photos.slice(0, 3) ?? [];
  const loadError =
    eventQuery.error instanceof Error
      ? eventQuery.error.message
      : eventQuery.error
        ? 'Could not load event.'
        : null;
  const hasNotes = Boolean(eventQuery.data?.notes?.trim());

  if (isLoadingGroups || eventQuery.isPending) {
    return (
      <View style={styles.screenCentered}>
        <ActivityIndicator color={sectionColors.events} />
      </View>
    );
  }

  if (!eventId || loadError || !eventQuery.data) {
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

          {eventQuery.data.mood ? (
            <View style={styles.moodPill}>
              <Text style={styles.moodPillText}>{eventQuery.data.mood}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bodyCard}>
          <Text style={styles.title}>{eventQuery.data.title}</Text>

          <View style={styles.metaStack}>
            <View style={styles.metaRow}>
              <CalendarDays color={sectionColors.events} size={14} />
              <Text style={styles.dateText}>{displayDate}</Text>
            </View>

            {eventQuery.data.locationText ? (
              <View style={styles.metaRow}>
                <MapPin color={baseColors.textSoft} size={14} />
                <Text style={styles.locationText}>
                  {eventQuery.data.locationText}
                </Text>
              </View>
            ) : null}
          </View>

          <Divider color={sectionColors.events} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Mood</Text>
            <Text style={styles.sectionBody}>
              {eventQuery.data.mood ?? 'No mood added'}
            </Text>
          </View>

          {hasNotes ? (
            <>
              <Divider color={sectionColors.events} />

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Notes</Text>
                <Text style={styles.sectionBody}>{eventQuery.data.notes}</Text>
              </View>
            </>
          ) : null}

          <Divider color={sectionColors.events} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photos</Text>
            <View style={styles.photosRow}>
              {Array.from({ length: 3 }).map((_, index) => {
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
                  <View key={photo} style={styles.photoThumbWrap}>
                    <Image
                      contentFit="cover"
                      source={{ uri: photo }}
                      style={styles.photoThumb}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
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
    gap: space.sm,
  },
  photoThumbWrap: {
    width: 111,
    height: 111,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: baseColors.card,
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
