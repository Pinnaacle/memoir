import Divider from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useChapterDetailQuery } from '@/hooks/useChapters';
import { parseLocalDate } from '@/lib/date';
import type { ChapterDetailEntry } from '@/services/chapters';
import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Image } from 'expo-image';
import { type Href, Link, router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const FALLBACK_COVER_IMAGE = require('../../assets/images/fallbackImage.png');

function formatOccurredOn(dateValue: string): string {
  const date = parseLocalDate(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(dateValue: string): string {
  const date = parseLocalDate(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
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

function entryHref(entry: ChapterDetailEntry): Href {
  if (entry.kind === 'moment') {
    return `/moments/${entry.id}` as Href;
  }
  return `/events/${entry.id}` as Href;
}

export default function ChapterDetailScreen() {
  const { width } = useWindowDimensions();
  const { activeGroup, isLoading: isLoadingGroups } = useActiveGroup();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const chapterId = Array.isArray(rawId) ? rawId[0] : rawId;
  const chapterQuery = useChapterDetailQuery(chapterId, activeGroup?.id);
  const chapter = chapterQuery.data;
  const bannerImages = (chapter?.entries ?? [])
    .map((entry) => entry.coverImage)
    .filter((url): url is string => Boolean(url));
  const hasBannerImages = bannerImages.length > 0;
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const displayDate = chapter ? formatOccurredOn(chapter.occurredOn) : '';
  const displayType = formatChapterType(chapter?.chapterType ?? null);
  const loadError =
    chapterQuery.error instanceof Error
      ? chapterQuery.error.message
      : chapterQuery.error
        ? 'Could not load chapter.'
        : null;

  function handleBannerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width <= 0) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveBannerIndex(nextIndex);
  }

  if (isLoadingGroups || chapterQuery.isPending) {
    return (
      <View style={styles.screenCentered}>
        <ActivityIndicator color={sectionColors.chapters} />
      </View>
    );
  }

  if (!chapterId || loadError || !chapter) {
    return (
      <View style={styles.screenCentered}>
        <Text style={styles.errorText}>
          {loadError ?? 'Chapter not found.'}
        </Text>
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
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerWrap}>
          {hasBannerImages ? (
            <ScrollView
              horizontal
              onMomentumScrollEnd={handleBannerScroll}
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.bannerScroll}
            >
              {bannerImages.map((bannerImage, index) => (
                <Image
                  contentFit="cover"
                  key={`${bannerImage}-${index}`}
                  source={{ uri: bannerImage }}
                  style={[styles.bannerImage, { width }]}
                />
              ))}
            </ScrollView>
          ) : (
            <Image
              contentFit="cover"
              source={FALLBACK_COVER_IMAGE}
              style={[styles.bannerImage, { width }]}
            />
          )}
          <View style={styles.bannerOverlay} />

          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{displayType}</Text>
          </View>

          {bannerImages.length > 1 ? (
            <View style={styles.bannerDots}>
              {bannerImages.map((bannerImage, index) => (
                <View
                  key={`dot-${bannerImage}-${index}`}
                  style={[
                    styles.bannerDot,
                    index === activeBannerIndex ? styles.bannerDotActive : null,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.bodyCard}>
          <Text style={styles.title}>{chapter.title}</Text>

          <View style={styles.dateRow}>
            <CalendarDays color={sectionColors.chapters} size={14} />
            <Text style={styles.dateText}>{displayDate}</Text>
          </View>

          {chapter.description ? (
            <>
              <Divider color={sectionColors.chapters} />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>About</Text>
                <Text style={styles.sectionBody}>{chapter.description}</Text>
              </View>
            </>
          ) : null}

          <Divider color={sectionColors.chapters} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {`In this chapter (${chapter.entries.length})`}
            </Text>
            {chapter.entries.length === 0 ? (
              <Text style={styles.emptyText}>
                No linked memories yet.
              </Text>
            ) : (
              <View style={styles.entriesList}>
                {chapter.entries.map((entry) => (
                  <Link
                    asChild
                    href={entryHref(entry)}
                    key={`${entry.kind}-${entry.id}`}
                  >
                    <Pressable
                      accessibilityHint="Opens this memory"
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.entryRow,
                        pressed ? styles.entryRowPressed : null,
                      ]}
                    >
                      <View style={styles.entryThumbContainer}>
                        <View style={styles.entryThumbWrap}>
                          <Image
                            contentFit="cover"
                            source={
                              entry.coverImage
                                ? { uri: entry.coverImage }
                                : FALLBACK_COVER_IMAGE
                            }
                            style={styles.entryThumb}
                          />
                        </View>
                        <View style={styles.entryOpenBadge}>
                          <ChevronRight
                            color={sectionColors.chapters}
                            size={14}
                            strokeWidth={2.5}
                          />
                        </View>
                      </View>

                      <View style={styles.entryBody}>
                        <Text numberOfLines={1} style={styles.entryTitle}>
                          {entry.title}
                        </Text>
                        <Text style={styles.entryMeta}>
                          {`${entry.kind === 'moment' ? 'Moment' : 'Event'} · ${formatShortDate(entry.occurredOn)}`}
                        </Text>
                      </View>
                    </Pressable>
                  </Link>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={styles.topButtons}>
        <Pressable
          accessibilityHint="Returns to chapters list"
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft color={baseColors.text} size={22} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  screenCentered: {
    alignItems: 'center',
    backgroundColor: baseColors.bg,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  content: {
    paddingBottom: space.xxl,
  },
  bannerWrap: {
    height: 320,
    position: 'relative',
  },
  bannerScroll: {
    height: '100%',
    width: '100%',
  },
  bannerImage: {
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  topButtons: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 40,
    zIndex: 1,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    left: space.lg - 6,
    position: 'absolute',
    top: space.lg,
    width: 40,
  },
  typePill: {
    alignItems: 'center',
    backgroundColor: sectionColors.chapters,
    borderRadius: radius.full,
    bottom: space.xl + space.xxs,
    height: 32,
    justifyContent: 'center',
    left: space.lg,
    paddingHorizontal: 14,
    position: 'absolute',
  },
  typePillText: {
    color: baseColors.bg,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
  bannerDots: {
    alignItems: 'center',
    bottom: space.sm,
    flexDirection: 'row',
    gap: space.xs,
    position: 'absolute',
    right: space.lg,
  },
  bannerDot: {
    backgroundColor: 'rgba(245, 240, 236, 0.45)',
    borderRadius: radius.full,
    height: 6,
    width: 6,
  },
  bannerDotActive: {
    backgroundColor: sectionColors.chapters,
    width: 16,
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
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.xs + 2,
  },
  dateText: {
    color: sectionColors.chapters,
    fontFamily: textTheme.family.mediumItalic,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
  },
  section: {
    gap: space.sm,
  },
  sectionLabel: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    letterSpacing: 0.78,
    lineHeight: textTheme.lineHeight.sm,
    textTransform: 'uppercase',
  },
  sectionBody: {
    color: baseColors.text,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  emptyText: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  entriesList: {
    gap: space.lg,
  },
  entryRow: {
    alignItems: 'center',
    backgroundColor: baseColors.card,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: space.md + space.xs,
    padding: space.md,
  },
  entryRowPressed: {
    opacity: 0.9,
  },
  entryThumbContainer: {
    height: 72,
    position: 'relative',
    width: 72,
  },
  entryThumbWrap: {
    borderRadius: radius.md,
    height: 72,
    overflow: 'hidden',
    width: 72,
  },
  entryThumb: {
    height: '100%',
    width: '100%',
  },
  entryBody: {
    flex: 1,
    gap: 4,
  },
  entryTitle: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
  entryMeta: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  entryOpenBadge: {
    alignItems: 'center',
    backgroundColor: baseColors.bg,
    borderColor: sectionColors.chapters,
    borderRadius: radius.full,
    borderWidth: 1,
    bottom: -6,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    width: 24,
  },
  errorText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    textAlign: 'center',
  },
  backTextButton: {
    marginTop: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  backText: {
    color: sectionColors.chapters,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
});
