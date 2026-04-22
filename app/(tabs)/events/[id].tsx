import {
  AddImageField,
  type SelectedImage,
} from '@/components/ui/AddImageField';
import Divider from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import {
  useDeleteEventMutation,
  useEventDetailQuery,
  useUpdateEventMutation,
} from '@/hooks/useEvents';
import { useImageUpload } from '@/hooks/useImageUpload';
import { MAX_IMAGES_PER_UPLOAD } from '@/lib/images';
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
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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

function parseOccurredAt(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  if ([year, month, day].every((part) => Number.isFinite(part))) {
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getInitialPhotos(
  photos: { storagePath: string; url: string }[],
): SelectedImage[] {
  return photos.map((photo) => ({
    id: photo.storagePath,
    uri: photo.url,
    fileName: photo.storagePath.split('/').pop() ?? null,
    storagePath: photo.storagePath,
    uploadStatus: 'uploaded',
    uploadError: null,
  }));
}

function getUploadedPhotos(photos: SelectedImage[]) {
  return photos
    .filter(
      (photo) =>
        photo.uploadStatus === 'uploaded' && Boolean(photo.storagePath),
    )
    .slice(0, MAX_IMAGES_PER_UPLOAD)
    .map((photo) => ({ storagePath: photo.storagePath! }));
}

function getPhotoKey(paths: { storagePath?: string | null }[]) {
  return paths
    .map((photo) => photo.storagePath?.trim())
    .filter((path): path is string => Boolean(path))
    .join('|');
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Failed to save event photos. Please try again.';
}

function getEventPhotoValues(event: {
  title: string;
  occurredOn: string;
  locationText: string | null;
  mood: string | null;
  notes: string | null;
}) {
  return {
    title: event.title,
    occurredAt: parseOccurredAt(event.occurredOn),
    location: event.locationText ?? '',
    mood: event.mood ?? '',
    notes: event.notes ?? '',
  };
}

export default function EventDetailScreen() {
  const { activeGroup, isLoading: isLoadingGroups } = useActiveGroup();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [photos, setPhotos] = useState<SelectedImage[]>([]);
  const [hasLocalPhotoChanges, setHasLocalPhotoChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSubmittedPhotoKeyRef = useRef<string | null>(null);
  const failedSavePhotoKeyRef = useRef<string | null>(null);
  const deleteEventMutation = useDeleteEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const { startUpload } = useImageUpload({
    bucket: 'events',
    setImages: setPhotos,
  });
  const eventQuery = useEventDetailQuery(eventId, activeGroup?.id);
  const event = eventQuery.data;
  const eventPhotoKey = getPhotoKey(event?.photos ?? []);
  const uploadedPhotoKey = getPhotoKey(getUploadedPhotos(photos));
  const displayDate = event?.occurredOn
    ? formatOccurredOn(event.occurredOn)
    : '';
  const heroImageUrl = photos[0]?.uri ?? event?.photos[0]?.url ?? null;
  const heroImageSource = heroImageUrl
    ? { uri: heroImageUrl }
    : FALLBACK_COVER_IMAGE;
  const loadError =
    eventQuery.error instanceof Error
      ? eventQuery.error.message
      : eventQuery.error
        ? 'Could not load event.'
        : null;
  const hasNotes = Boolean(event?.notes?.trim());
  const isDeleting = deleteEventMutation.isPending;
  const isSavingPhotos = updateEventMutation.isPending;
  const isMutatingEvent = isDeleting || isSavingPhotos;
  const failedUploads = photos.filter(
    (photo) => photo.uploadStatus === 'failed',
  );
  const hasFailedUploads = failedUploads.length > 0;
  const hasTransientPhotos = photos.some(
    (photo) => photo.uploadStatus !== 'uploaded',
  );
  const hasPendingUploads = photos.some(
    (photo) =>
      photo.uploadStatus === 'local' || photo.uploadStatus === 'uploading',
  );
  const retryUploadsDisabled =
    isDeleting || isSavingPhotos || hasPendingUploads;
  const retrySaveDisabled = isMutatingEvent || hasPendingUploads;

  useEffect(() => {
    if (!event) {
      return;
    }

    const nextPhotos = getInitialPhotos(event.photos);

    if (hasLocalPhotoChanges) {
      if (!hasTransientPhotos && uploadedPhotoKey === eventPhotoKey) {
        setHasLocalPhotoChanges(false);
        setSaveError(null);
        failedSavePhotoKeyRef.current = null;
        lastSubmittedPhotoKeyRef.current = eventPhotoKey;
      }

      return;
    }

    setPhotos((current) => {
      const currentPhotoKey = getPhotoKey(getUploadedPhotos(current));
      const hasCurrentTransientPhotos = current.some(
        (photo) => photo.uploadStatus !== 'uploaded',
      );

      if (
        hasCurrentTransientPhotos ||
        (currentPhotoKey === eventPhotoKey &&
          current.length === nextPhotos.length)
      ) {
        return current;
      }

      return nextPhotos;
    });

    lastSubmittedPhotoKeyRef.current = eventPhotoKey;
  }, [
    event,
    eventPhotoKey,
    hasLocalPhotoChanges,
    hasTransientPhotos,
    photos,
    uploadedPhotoKey,
  ]);

  const savePhotos = useCallback(
    async (nextPhotos: SelectedImage[]) => {
      if (!eventId || !activeGroup?.id || !event) {
        return;
      }

      const uploadedPhotos = getUploadedPhotos(nextPhotos);
      const nextPhotoKey = getPhotoKey(uploadedPhotos);

      if (nextPhotoKey === eventPhotoKey) {
        return;
      }

      lastSubmittedPhotoKeyRef.current = nextPhotoKey;
      failedSavePhotoKeyRef.current = null;
      setSaveError(null);

      try {
        await updateEventMutation.mutateAsync({
          eventId,
          groupId: activeGroup.id,
          ...getEventPhotoValues(event),
          photos: uploadedPhotos,
        });
      } catch (error) {
        failedSavePhotoKeyRef.current = nextPhotoKey;
        lastSubmittedPhotoKeyRef.current = null;
        setSaveError(getErrorMessage(error));
      }
    },
    [activeGroup?.id, event, eventId, eventPhotoKey, updateEventMutation],
  );

  useEffect(() => {
    if (!hasLocalPhotoChanges || !event) {
      return;
    }

    if (hasPendingUploads || isSavingPhotos) {
      return;
    }

    if (uploadedPhotoKey === eventPhotoKey) {
      return;
    }

    if (
      failedSavePhotoKeyRef.current === uploadedPhotoKey ||
      lastSubmittedPhotoKeyRef.current === uploadedPhotoKey
    ) {
      return;
    }

    void savePhotos(photos);
  }, [
    event,
    eventPhotoKey,
    hasLocalPhotoChanges,
    hasPendingUploads,
    isSavingPhotos,
    photos,
    savePhotos,
    uploadedPhotoKey,
  ]);

  function handlePhotoChange(nextPhotos: SelectedImage[]) {
    setSaveError(null);
    setHasLocalPhotoChanges(true);
    failedSavePhotoKeyRef.current = null;
    setPhotos(nextPhotos);
  }

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

    if (!eventId || isSavingPhotos) {
      return;
    }

    router.push(`/events/new?eventId=${encodeURIComponent(eventId)}`);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);

    if (!eventId || !activeGroup?.id || isMutatingEvent) {
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
            disabled={isMutatingEvent}
            onPress={() => setIsMenuOpen(true)}
            style={[
              styles.menuButton,
              {
                top: space.lg,
              },
              isMutatingEvent ? styles.menuButtonDisabled : null,
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
            <AddImageField
              color={sectionColors.events}
              disabled={isMutatingEvent}
              maxImages={MAX_IMAGES_PER_UPLOAD}
              onChange={handlePhotoChange}
              onRequestUpload={startUpload}
              value={photos}
            />

            {hasFailedUploads ? (
              <Pressable
                accessibilityHint="Retries failed photo uploads"
                accessibilityLabel="Retry failed uploads"
                accessibilityRole="button"
                disabled={retryUploadsDisabled}
                onPress={() => {
                  setSaveError(null);
                  void startUpload(failedUploads);
                }}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed ? styles.retryButtonPressed : null,
                  retryUploadsDisabled ? styles.retryButtonDisabled : null,
                ]}
              >
                <Text style={styles.retryButtonText}>Retry failed uploads</Text>
              </Pressable>
            ) : null}

            {saveError ? (
              <>
                <Text style={styles.fieldErrorText}>{saveError}</Text>
                <Pressable
                  accessibilityHint="Retries saving the current event photos"
                  accessibilityLabel="Retry saving photos"
                  accessibilityRole="button"
                  disabled={retrySaveDisabled}
                  onPress={() => {
                    failedSavePhotoKeyRef.current = null;
                    void savePhotos(photos);
                  }}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed ? styles.retryButtonPressed : null,
                    retrySaveDisabled ? styles.retryButtonDisabled : null,
                  ]}
                >
                  <Text style={styles.retryButtonText}>
                    Retry saving photos
                  </Text>
                </Pressable>
              </>
            ) : null}

            {isSavingPhotos ? (
              <View style={styles.submittingRow}>
                <ActivityIndicator color={sectionColors.events} />
                <Text style={styles.submittingText}>Saving photos...</Text>
              </View>
            ) : null}
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
              disabled={isMutatingEvent}
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.menuAction,
                pressed ? styles.menuActionPressed : null,
                isMutatingEvent ? styles.menuActionDisabled : null,
              ]}
            >
              <Text style={styles.menuActionDangerText}>
                {isDeleting
                  ? 'Deleting...'
                  : isSavingPhotos
                    ? 'Saving photos...'
                    : 'Delete event'}
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
  retryButton: {
    alignSelf: 'flex-start',
    borderColor: sectionColors.events,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  retryButtonPressed: {
    opacity: 0.82,
  },
  retryButtonDisabled: {
    opacity: 0.45,
  },
  retryButtonText: {
    color: sectionColors.events,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
  },
  submittingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  submittingText: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
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
  fieldErrorText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
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
