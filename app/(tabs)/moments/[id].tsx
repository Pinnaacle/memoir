import Divider from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useMomentDetailQuery } from '@/hooks/useMoments';
import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, ChevronLeft } from 'lucide-react-native';
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

export default function MomentDetailScreen() {
  const { width } = useWindowDimensions();
  const { activeGroup, isLoading: isLoadingGroups } = useActiveGroup();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const momentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const momentQuery = useMomentDetailQuery(momentId, activeGroup?.id);
  const moment = momentQuery.data;
  const displayDate = moment ? formatOccurredOn(moment.occurredOn) : '';
  const displayType = formatMomentType(moment?.category ?? null);
  const bannerImages = moment?.photos?.length
    ? moment.photos
    : [FALLBACK_COVER_IMAGE];
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const photoThumbs = moment?.photos?.slice(0, 3) ?? [];
  const loadError =
    momentQuery.error instanceof Error
      ? momentQuery.error.message
      : momentQuery.error
        ? 'Could not load moment.'
        : null;

  function handleBannerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width <= 0) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveBannerIndex(nextIndex);
  }

  if (isLoadingGroups || momentQuery.isPending) {
    return (
      <View style={styles.screenCentered}>
        <ActivityIndicator color={sectionColors.moments} />
      </View>
    );
  }

  if (!momentId || loadError || !moment) {
    return (
      <View style={styles.screenCentered}>
        <Text style={styles.errorText}>{loadError ?? 'Moment not found.'}</Text>
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
                key={
                  typeof bannerImage === 'string'
                    ? bannerImage
                    : `fallback-${index}`
                }
                source={
                  typeof bannerImage === 'string'
                    ? { uri: bannerImage }
                    : bannerImage
                }
                style={[styles.bannerImage, { width }]}
              />
            ))}
          </ScrollView>
          <View style={styles.bannerOverlay} />

          <Pressable
            accessibilityHint="Returns to moments list"
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft color={baseColors.text} size={22} />
          </Pressable>

          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{displayType}</Text>
          </View>

          {bannerImages.length > 1 ? (
            <View style={styles.bannerDots}>
              {bannerImages.map((bannerImage, index) => (
                <View
                  key={
                    typeof bannerImage === 'string'
                      ? `dot-${bannerImage}`
                      : 'dot-fallback-cover'
                  }
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
          <Text style={styles.title}>{moment.title}</Text>

          <View style={styles.dateRow}>
            <CalendarDays color={sectionColors.moments} size={14} />
            <Text style={styles.dateText}>{displayDate}</Text>
          </View>

          <Divider color={sectionColors.moments} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Memory</Text>
            <Text style={styles.sectionBody}>{moment.description ?? ''}</Text>
          </View>

          <Divider color={sectionColors.moments} />

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
                    <Image contentFit="cover" source={{ uri: photo }} />
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
    backgroundColor: sectionColors.moments,
    borderRadius: radius.full,
    bottom: space.xl + space.xxs,
    height: 32,
    justifyContent: 'center',
    left: space.lg,
    paddingHorizontal: 14,
    position: 'absolute',
  },
  typePillText: {
    color: '#1a1512',
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
    backgroundColor: sectionColors.moments,
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
    color: sectionColors.moments,
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
  photosRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  photoThumbWrap: {
    borderRadius: 14,
    height: 111,
    overflow: 'hidden',
    width: 111,
  },

  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: baseColors.card,
    borderColor: 'rgba(107,101,96,0.27)',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 111,
    justifyContent: 'center',
    width: 111,
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
    marginTop: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  backText: {
    color: sectionColors.moments,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
});
