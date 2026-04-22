import {
  AddImageField,
  type SelectedImage,
} from '@/components/ui/AddImageField';
import Divider from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import {
  useDeleteMomentMutation,
  useMomentDetailQuery,
  useUpdateMomentMutation,
} from '@/hooks/useMoments';
import { useImageUpload } from '@/hooks/useImageUpload';
import { MAX_IMAGES_PER_UPLOAD } from '@/lib/images';
import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, ChevronLeft, Ellipsis } from 'lucide-react-native';
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

const FALLBACK_COVER_IMAGE = require('../../assets/images/fallbackImage.png');

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
    : 'Failed to save moment photos. Please try again.';
}

function getMomentPhotoValues(moment: {
  title: string;
  occurredOn: string;
  category: string | null;
  description: string | null;
}) {
  return {
    title: moment.title,
    occurredAt: parseOccurredAt(moment.occurredOn),
    momentType: moment.category ?? '',
    description: moment.description ?? '',
  };
}

export default function MomentDetailScreen() {
  const { activeGroup, isLoading: isLoadingGroups } = useActiveGroup();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const momentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [photos, setPhotos] = useState<SelectedImage[]>([]);
  const [hasLocalPhotoChanges, setHasLocalPhotoChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSubmittedPhotoKeyRef = useRef<string | null>(null);
  const failedSavePhotoKeyRef = useRef<string | null>(null);
  const deleteMomentMutation = useDeleteMomentMutation();
  const updateMomentMutation = useUpdateMomentMutation();
  const { startUpload } = useImageUpload({
    bucket: 'moments',
    setImages: setPhotos,
  });
  const momentQuery = useMomentDetailQuery(momentId, activeGroup?.id);
  const moment = momentQuery.data;
  const momentPhotoKey = getPhotoKey(moment?.photos ?? []);
  const uploadedPhotoKey = getPhotoKey(getUploadedPhotos(photos));
  const displayDate = moment?.occurredOn
    ? formatOccurredOn(moment.occurredOn)
    : '';
  const displayType = formatMomentType(moment?.category ?? null);
  const heroImageUrl = photos[0]?.uri ?? moment?.photos[0]?.url ?? null;
  const heroImageSource = heroImageUrl
    ? { uri: heroImageUrl }
    : FALLBACK_COVER_IMAGE;
  const loadError =
    momentQuery.error instanceof Error
      ? momentQuery.error.message
      : momentQuery.error
        ? 'Could not load moment.'
        : null;
  const hasDescription = Boolean(moment?.description?.trim());
  const isDeleting = deleteMomentMutation.isPending;
  const isSavingPhotos = updateMomentMutation.isPending;
  const isMutatingMoment = isDeleting || isSavingPhotos;
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
  const retrySaveDisabled = isMutatingMoment || hasPendingUploads;
  const deleteActionLabel = isDeleting
    ? 'Deleting...'
    : isSavingPhotos
      ? 'Saving photos...'
      : 'Delete moment';

  useEffect(() => {
    if (!moment) {
      return;
    }

    const nextPhotos = getInitialPhotos(moment.photos);

    if (hasLocalPhotoChanges) {
      if (!hasTransientPhotos && uploadedPhotoKey === momentPhotoKey) {
        setHasLocalPhotoChanges(false);
        setSaveError(null);
        failedSavePhotoKeyRef.current = null;
        lastSubmittedPhotoKeyRef.current = momentPhotoKey;
      }

      return;
    }

    setPhotos((current) => {
      const currentUploadedPhotoKey = getPhotoKey(getUploadedPhotos(current));
      const hasCurrentTransientPhotos = current.some(
        (photo) => photo.uploadStatus !== 'uploaded',
      );

      if (
        hasCurrentTransientPhotos ||
        (currentUploadedPhotoKey === momentPhotoKey &&
          current.length === nextPhotos.length)
      ) {
        return current;
      }

      return nextPhotos;
    });

    lastSubmittedPhotoKeyRef.current = momentPhotoKey;
  }, [
    hasLocalPhotoChanges,
    hasTransientPhotos,
    moment,
    momentPhotoKey,
    uploadedPhotoKey,
  ]);

  const savePhotos = useCallback(
    async (nextPhotos: SelectedImage[]) => {
      if (!momentId || !activeGroup?.id || !moment) {
        return;
      }

      const uploadedPhotos = getUploadedPhotos(nextPhotos);
      const nextPhotoKey = getPhotoKey(uploadedPhotos);

      if (nextPhotoKey === momentPhotoKey) {
        return;
      }

      lastSubmittedPhotoKeyRef.current = nextPhotoKey;
      failedSavePhotoKeyRef.current = null;
      setSaveError(null);

      try {
        await updateMomentMutation.mutateAsync({
          momentId,
          groupId: activeGroup.id,
          ...getMomentPhotoValues(moment),
          photos: uploadedPhotos,
        });
      } catch (error) {
        failedSavePhotoKeyRef.current = nextPhotoKey;
        lastSubmittedPhotoKeyRef.current = null;
        setSaveError(getErrorMessage(error));
      }
    },
    [activeGroup?.id, moment, momentId, momentPhotoKey, updateMomentMutation],
  );

  useEffect(() => {
    if (!hasLocalPhotoChanges || !moment) {
      return;
    }

    if (hasPendingUploads || isSavingPhotos) {
      return;
    }

    if (uploadedPhotoKey === momentPhotoKey) {
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
    hasLocalPhotoChanges,
    hasPendingUploads,
    isSavingPhotos,
    moment,
    momentPhotoKey,
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

  function handleRetryFailedUploads() {
    setSaveError(null);
    void startUpload(failedUploads);
  }

  function handleRetrySave() {
    failedSavePhotoKeyRef.current = null;
    void savePhotos(photos);
  }

  const removeMoment = async () => {
    if (!momentId || !activeGroup?.id) {
      return;
    }

    try {
      await deleteMomentMutation.mutateAsync({
        momentId,
        groupId: activeGroup.id,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        'Could not delete moment',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const handleEdit = () => {
    setIsMenuOpen(false);

    if (!momentId || isSavingPhotos) {
      return;
    }

    router.push(`/moments/new?momentId=${encodeURIComponent(momentId)}`);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);

    if (!momentId || !activeGroup?.id || isMutatingMoment) {
      return;
    }

    Alert.alert(
      'Delete moment?',
      'This moment and its photos will be removed permanently.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeMoment();
          },
        },
      ],
    );
  };

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
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image
            contentFit="cover"
            source={heroImageSource}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />

          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{displayType}</Text>
          </View>
        </View>

        <View style={styles.bodyCard}>
          <Text style={styles.title}>{moment.title}</Text>

          <View style={styles.metaRow}>
            <CalendarDays color={sectionColors.moments} size={14} />
            <Text style={styles.dateText}>{displayDate}</Text>
          </View>

          <Divider color={sectionColors.moments} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Memory</Text>
            <Text style={styles.sectionBody}>
              {hasDescription ? moment.description : 'No memory added'}
            </Text>
          </View>

          <Divider color={sectionColors.moments} />

          <View style={styles.section}>
            <AddImageField
              color={sectionColors.moments}
              disabled={isMutatingMoment}
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
                onPress={handleRetryFailedUploads}
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
                  accessibilityHint="Retries saving the current moment photos"
                  accessibilityLabel="Retry saving photos"
                  accessibilityRole="button"
                  disabled={retrySaveDisabled}
                  onPress={handleRetrySave}
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
                <ActivityIndicator color={sectionColors.moments} />
                <Text style={styles.submittingText}>Saving photos...</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={styles.topButtons}>
        <Pressable
          accessibilityHint="Returns to the moments list"
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft color={baseColors.text} size={22} />
        </Pressable>

        <Pressable
          accessibilityHint="Opens moment actions"
          accessibilityLabel="More options"
          accessibilityRole="button"
          disabled={isMutatingMoment}
          onPress={() => setIsMenuOpen(true)}
          style={[
            styles.menuButton,
            isMutatingMoment ? styles.menuButtonDisabled : null,
          ]}
        >
          <Ellipsis color={baseColors.text} size={22} />
        </Pressable>
      </View>

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
              <Text style={styles.menuActionText}>Edit moment</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              accessibilityRole="button"
              disabled={isMutatingMoment}
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.menuAction,
                pressed ? styles.menuActionPressed : null,
                isMutatingMoment ? styles.menuActionDisabled : null,
              ]}
            >
              <Text style={styles.menuActionDangerText}>
                {deleteActionLabel}
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
    alignItems: 'center',
    backgroundColor: baseColors.bg,
    flex: 1,
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
  topButtons: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 60,
    zIndex: 1,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    left: space.lg,
    position: 'absolute',
    width: 40,
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: space.lg,
    width: 40,
  },
  menuButtonDisabled: {
    opacity: 0.45,
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
    paddingBottom: space.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
  },
  title: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.xxl,
    lineHeight: textTheme.lineHeight.xl,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
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
  retryButton: {
    alignSelf: 'flex-start',
    borderColor: sectionColors.moments,
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
    color: sectionColors.moments,
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
    backgroundColor: baseColors.bg,
    borderColor: 'rgba(107, 101, 96, 0.16)',
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 168,
    overflow: 'hidden',
    position: 'absolute',
    right: space.lg,
    top: space.lg + 84,
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
    backgroundColor: 'rgba(107, 101, 96, 0.12)',
    height: 1,
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
    color: sectionColors.moments,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
});
