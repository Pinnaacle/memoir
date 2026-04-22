import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useMomentsQuery } from '@/hooks/useMoments';
import { triggerTapFeedback } from '@/lib/interaction';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text } from '@/theme/type';
import { type Href, router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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
  const {
    activeGroup,
    errorMessage: groupError,
    isLoading: isLoadingGroups,
  } = useActiveGroup();
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
      : (activeGroup?.name ?? 'this space');
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);
  const releaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (releaseTimeoutRef.current) {
        clearTimeout(releaseTimeoutRef.current);
      }
    };
  }, []);

  function handleNavigate(href: Href) {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;
    setIsNavigating(true);
    void triggerTapFeedback();
    router.push(href);
    releaseTimeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
      setIsNavigating(false);
    }, 700);
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
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
                <Pressable
                  accessibilityHint="Opens this moment"
                  accessibilityRole="button"
                  disabled={isNavigating}
                  key={moment.id}
                  onPress={() => handleNavigate(`/moments/${moment.id}`)}
                  style={({ pressed }) => [
                    styles.cardPressable,
                    pressed ? styles.cardPressed : null,
                    isNavigating ? styles.cardDisabled : null,
                  ]}
                >
                  <View pointerEvents="none" style={styles.cardInner}>
                    <Card
                      color={sectionColors.moments}
                      coverImage={moment.coverImage ?? FALLBACK_COVER_IMAGE}
                      date={formatOccurredOn(moment.occurredOn)}
                      description={moment.description ?? ''}
                      title={moment.title}
                      type={formatMomentType(moment.category)}
                      variant="default"
                    />
                  </View>
                </Pressable>
              ))
            : null}
        </View>
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        disabled={isNavigating}
        onPress={() => handleNavigate('/moments/new')}
        style={({ pressed }) => [
          styles.createButton,
          pressed ? styles.cardPressed : null,
          isNavigating ? styles.createButtonDisabled : null,
        ]}
      >
        <Plus color={baseColors.bg} size={28} strokeWidth={2.4} />
      </Pressable>
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
    paddingBottom: 110,
  },
  loader: {
    marginTop: space.xl,
  },
  cardPressable: {
    borderRadius: 26,
  },
  cardInner: {
    borderRadius: 26,
  },
  cardPressed: {
    opacity: 0.82,
  },
  cardDisabled: {
    opacity: 0.55,
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
  createButtonDisabled: {
    opacity: 0.55,
  },
});
