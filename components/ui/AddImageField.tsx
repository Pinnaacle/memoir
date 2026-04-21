import { MAX_IMAGES_PER_UPLOAD } from '@/lib/images';
import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Text } from './Text';

export type ImageUploadStatus = 'local' | 'uploading' | 'uploaded' | 'failed';

const DEFAULT_MAX_IMAGES = MAX_IMAGES_PER_UPLOAD;
const GRID_COLUMNS = 3;
const GRID_GAP = space.md;

export type SelectedImage = {
  id: string;
  uri: string;
  assetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  width?: number;
  height?: number;
  fileSize?: number;
  storagePath?: string | null;
  uploadStatus?: ImageUploadStatus;
  uploadError?: string | null;
};

interface AddImageFieldProps extends ViewProps {
  value: SelectedImage[];
  onChange?: (next: SelectedImage[]) => void;
  label?: string;
  color?: string;
  editable?: boolean;
  allowsMultipleSelection?: boolean;
  maxImages?: number;
  disabled?: boolean;
  onRequestUpload?: (images: SelectedImage[]) => void;
}

function createSelectedImage(
  asset: ImagePicker.ImagePickerAsset,
): SelectedImage {
  const id = asset.assetId ?? asset.uri;

  return {
    id,
    uri: asset.uri,
    assetId: asset.assetId ?? null,
    fileName: asset.fileName ?? null,
    mimeType: asset.mimeType ?? null,
    width: asset.width > 0 ? asset.width : undefined,
    height: asset.height > 0 ? asset.height : undefined,
    fileSize: asset.fileSize,
    storagePath: null,
    uploadStatus: 'local',
    uploadError: null,
  };
}

function getNewImages(
  currentImages: SelectedImage[],
  pickedImages: SelectedImage[],
): SelectedImage[] {
  const existingIds = new Set(currentImages.map((image) => image.id));

  return pickedImages.filter((image) => !existingIds.has(image.id));
}

export function AddImageField({
  value,
  onChange,
  label = 'Photos',
  color = sectionColors.events,
  editable,
  allowsMultipleSelection = true,
  maxImages,
  disabled = false,
  onRequestUpload,
  style,
  ...rest
}: AddImageFieldProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const insets = useSafeAreaInsets();
  const isEditable = editable ?? Boolean(onChange);
  const resolvedMaxImages =
    maxImages ??
    (isEditable ? DEFAULT_MAX_IMAGES : value.length || DEFAULT_MAX_IMAGES);
  const images = value.slice(0, resolvedMaxImages);
  const imageCount = value.length;
  const remainingSlots = Math.max(resolvedMaxImages - images.length, 0);
  const canAddMore = isEditable && remainingSlots > 0;
  const isDisabled = disabled || isPicking || !isEditable;
  const itemSize =
    gridWidth > GRID_GAP * (GRID_COLUMNS - 1)
      ? (gridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS
      : 0;
  const activeImage =
    activeImageIndex === null ? null : images[activeImageIndex];
  const canGoBackward = activeImageIndex !== null && activeImageIndex > 0;
  const canGoForward =
    activeImageIndex !== null && activeImageIndex < images.length - 1;

  useEffect(() => {
    if (activeImageIndex === null) {
      return;
    }

    if (images.length === 0) {
      setActiveImageIndex(null);
      return;
    }

    if (activeImageIndex > images.length - 1) {
      setActiveImageIndex(images.length - 1);
    }
  }, [activeImageIndex, images.length]);

  function handleGridLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.round(event.nativeEvent.layout.width);

    setGridWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  }

  async function handleAddImages() {
    if (!isEditable || !onChange || isDisabled) {
      return;
    }

    if (!canAddMore) {
      Alert.alert(
        'Photo limit reached',
        `You can attach up to ${resolvedMaxImages} photos.`,
      );
      return;
    }

    setIsPicking(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: allowsMultipleSelection && remainingSlots > 1,
        mediaTypes: ['images'],
        quality: 1,
        selectionLimit: remainingSlots,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const pickedImages = result.assets.map(createSelectedImage);
      const newImages = getNewImages(images, pickedImages).slice(
        0,
        remainingSlots,
      );

      if (newImages.length === 0) {
        return;
      }

      const nextImages = [...images, ...newImages];
      onChange(nextImages);
      onRequestUpload?.(newImages);
    } catch {
      Alert.alert(
        'Could not open photos',
        Constants.appOwnership === 'expo'
          ? 'Expo Go could not open the system photo picker. Close and reopen Expo Go, then try again.'
          : 'Please try again in a moment.',
      );
    } finally {
      setIsPicking(false);
    }
  }

  function handleRemoveImage(imageId: string) {
    if (!isEditable || !onChange || disabled || isPicking) {
      return;
    }

    onChange(images.filter((image) => image.id !== imageId));
  }

  function handleOpenViewer(index: number) {
    if (!images[index]) {
      return;
    }

    setActiveImageIndex(index);
  }

  function handleCloseViewer() {
    setActiveImageIndex(null);
  }

  function handlePreviousImage() {
    setActiveImageIndex((currentIndex) => {
      if (currentIndex === null || currentIndex === 0) {
        return currentIndex;
      }

      return currentIndex - 1;
    });
  }

  function handleNextImage() {
    setActiveImageIndex((currentIndex) => {
      if (currentIndex === null || currentIndex >= images.length - 1) {
        return currentIndex;
      }

      return currentIndex + 1;
    });
  }

  return (
    <View {...rest} style={[styles.field, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {label} <Text style={styles.count}>({imageCount})</Text>
        </Text>

        {canAddMore ? (
          <Pressable
            accessibilityHint="Opens your photo library"
            accessibilityLabel={`Add a photo to ${label.toLowerCase()}`}
            accessibilityRole="button"
            disabled={isDisabled}
            hitSlop={space.sm}
            onPress={handleAddImages}
            style={({ pressed }) => [
              styles.headerAction,
              pressed && !isDisabled ? styles.pressed : null,
              isDisabled ? styles.disabled : null,
            ]}
          >
            <Text style={[styles.headerActionText, { color }]}>
              + Add Photo
            </Text>
          </Pressable>
        ) : null}
      </View>

      {images.length === 0 ? (
        isEditable ? (
          <Pressable
            accessibilityHint="Opens your photo library"
            accessibilityLabel={`Add photos to ${label.toLowerCase()}`}
            accessibilityRole="button"
            disabled={isDisabled}
            onPress={handleAddImages}
            style={({ pressed }) => [
              styles.emptyTrigger,
              pressed && !isDisabled ? styles.pressed : null,
              isDisabled ? styles.disabled : null,
            ]}
          >
            <Camera
              color={baseColors.textMuted}
              size={textTheme.size.xl + space.sm}
              strokeWidth={1.75}
            />
            <Text style={styles.emptyText}>Tap to add photos</Text>
          </Pressable>
        ) : (
          <View style={[styles.emptyTrigger, styles.emptyState]}>
            <Camera
              color={baseColors.textMuted}
              size={textTheme.size.xl + space.sm}
              strokeWidth={1.75}
            />
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        )
      ) : (
        <View onLayout={handleGridLayout} style={styles.grid}>
          {images.map((image, index) => (
            <View
              key={image.id}
              style={[
                styles.gridItemShell,
                { height: itemSize, width: itemSize },
              ]}
            >
              <Pressable
                accessibilityHint="Opens this photo full screen"
                accessibilityLabel={`View ${image.fileName ?? 'photo'} full screen`}
                accessibilityRole="button"
                onPress={() => handleOpenViewer(index)}
                style={({ pressed }) => [
                  styles.gridItem,
                  { height: itemSize, width: itemSize },
                  pressed ? styles.pressed : null,
                ]}
              >
                <Image
                  source={{ uri: image.uri }}
                  style={styles.preview}
                  contentFit="cover"
                />

                {image.uploadStatus === 'uploading' ? (
                  <View style={styles.statusOverlay}>
                    <ActivityIndicator color={baseColors.text} size="small" />
                  </View>
                ) : null}

                {image.uploadStatus === 'failed' ? (
                  <View
                    style={[styles.statusOverlay, styles.statusOverlayError]}
                  >
                    <AlertTriangle
                      color={baseColors.text}
                      size={20}
                      strokeWidth={2.25}
                    />
                  </View>
                ) : null}
              </Pressable>

              {isEditable ? (
                <Pressable
                  accessibilityHint="Removes this photo from the event draft"
                  accessibilityLabel={`Remove ${image.fileName ?? 'photo'}`}
                  accessibilityRole="button"
                  disabled={disabled || isPicking}
                  hitSlop={space.sm}
                  onPress={() => handleRemoveImage(image.id)}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && !disabled && !isPicking ? styles.pressed : null,
                    disabled || isPicking ? styles.disabled : null,
                  ]}
                >
                  <X color={baseColors.text} size={14} strokeWidth={2.25} />
                </Pressable>
              ) : null}
            </View>
          ))}

          {canAddMore ? (
            <Pressable
              accessibilityHint="Opens your photo library"
              accessibilityLabel="Add another photo"
              accessibilityRole="button"
              disabled={isDisabled}
              onPress={handleAddImages}
              style={({ pressed }) => [
                styles.compactTrigger,
                styles.gridItem,
                { height: itemSize, width: itemSize },
                pressed && !isDisabled ? styles.pressed : null,
                isDisabled ? styles.disabled : null,
              ]}
            >
              <Plus color={baseColors.textMuted} size={18} strokeWidth={1.75} />
            </Pressable>
          ) : null}
        </View>
      )}

      <Modal
        animationType="fade"
        onRequestClose={handleCloseViewer}
        statusBarTranslucent
        transparent
        visible={activeImageIndex !== null}
      >
        <SafeAreaView edges={['bottom']} style={styles.viewerSafeArea}>
          <View
            style={[styles.viewerHeader, { paddingTop: insets.top + space.md }]}
          >
            <Pressable
              accessibilityHint="Closes the photo viewer"
              accessibilityLabel="Close photo viewer"
              accessibilityRole="button"
              hitSlop={space.sm}
              onPress={handleCloseViewer}
              style={({ pressed }) => [
                styles.viewerHeaderButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <X color={baseColors.text} size={18} strokeWidth={2.25} />
            </Pressable>

            <Text style={styles.viewerCount}>
              {activeImageIndex === null
                ? ''
                : `${activeImageIndex + 1} of ${images.length}`}
            </Text>

            <View style={styles.viewerHeaderSpacer} />
          </View>

          <View style={styles.viewerBody}>
            {images.length > 1 ? (
              <Pressable
                accessibilityHint="Shows the previous photo"
                accessibilityLabel="Previous photo"
                accessibilityRole="button"
                disabled={!canGoBackward}
                onPress={handlePreviousImage}
                style={({ pressed }) => [
                  styles.viewerNavButton,
                  !canGoBackward ? styles.disabled : null,
                  pressed && canGoBackward ? styles.pressed : null,
                ]}
              >
                <ChevronLeft
                  color={baseColors.text}
                  size={22}
                  strokeWidth={2.25}
                />
              </Pressable>
            ) : (
              <View style={styles.viewerNavSpacer} />
            )}

            <View style={styles.viewerImageFrame}>
              {activeImage ? (
                <Image
                  source={{ uri: activeImage.uri }}
                  style={styles.viewerImage}
                  contentFit="contain"
                />
              ) : null}
            </View>

            {images.length > 1 ? (
              <Pressable
                accessibilityHint="Shows the next photo"
                accessibilityLabel="Next photo"
                accessibilityRole="button"
                disabled={!canGoForward}
                onPress={handleNextImage}
                style={({ pressed }) => [
                  styles.viewerNavButton,
                  !canGoForward ? styles.disabled : null,
                  pressed && canGoForward ? styles.pressed : null,
                ]}
              >
                <ChevronRight
                  color={baseColors.text}
                  size={22}
                  strokeWidth={2.25}
                />
              </Pressable>
            ) : (
              <View style={styles.viewerNavSpacer} />
            )}
          </View>

          {images.length > 1 ? (
            <ScrollView
              contentContainerStyle={styles.viewerThumbnailContent}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {images.map((image, index) => (
                <Pressable
                  key={`${image.id}-viewer-thumb`}
                  accessibilityHint="Shows this photo in the viewer"
                  accessibilityLabel={`Open photo ${index + 1}`}
                  accessibilityRole="button"
                  onPress={() => handleOpenViewer(index)}
                  style={({ pressed }) => [
                    styles.viewerThumbnail,
                    activeImageIndex === index
                      ? styles.viewerThumbnailActive
                      : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.viewerThumbnailImage}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: space.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.lg,
  },
  count: {
    fontVariant: ['tabular-nums'],
  },
  headerAction: {
    borderRadius: radius.full,
    paddingHorizontal: space.xs,
    paddingVertical: space.xxs,
  },
  headerActionText: {
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.lg,
  },
  emptyTrigger: {
    alignItems: 'center',
    backgroundColor: baseColors.card,
    borderColor: 'rgba(107, 101, 96, 0.4)',
    borderCurve: 'continuous',
    borderRadius: radius.xl,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: space.sm,
    justifyContent: 'center',
    minHeight: space.xxl * 5,
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl + space.sm,
  },
  emptyText: {
    color: baseColors.textMuted,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  emptyState: {
    borderStyle: 'solid',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  gridItemShell: {
    position: 'relative',
  },
  gridItem: {
    backgroundColor: baseColors.card,
    borderCurve: 'continuous',
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  preview: {
    height: '100%',
    width: '100%',
  },
  statusOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 13, 12, 0.55)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  statusOverlayError: {
    backgroundColor: 'rgba(142, 35, 35, 0.65)',
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.78)',
    borderColor: 'rgba(245, 240, 236, 0.18)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: space.xs,
    top: space.xs,
    width: 28,
  },
  compactTrigger: {
    alignItems: 'center',
    borderColor: 'rgba(107, 101, 96, 0.4)',
    borderStyle: 'dashed',
    borderWidth: 2,
    justifyContent: 'center',
  },
  viewerSafeArea: {
    backgroundColor: 'rgba(15, 13, 12, 0.96)',
    flex: 1,
  },
  viewerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  viewerHeaderButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 240, 236, 0.08)',
    borderColor: 'rgba(245, 240, 236, 0.16)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  viewerCount: {
    color: baseColors.text,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.sm,
  },
  viewerHeaderSpacer: {
    width: 36,
  },
  viewerBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xl,
  },
  viewerImageFrame: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  viewerImage: {
    flex: 1,
    width: '100%',
  },
  viewerNavButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 240, 236, 0.08)',
    borderColor: 'rgba(245, 240, 236, 0.16)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  viewerNavSpacer: {
    width: 40,
  },
  viewerThumbnailContent: {
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  viewerThumbnail: {
    borderColor: 'transparent',
    borderRadius: radius.md,
    borderWidth: 2,
    height: 64,
    overflow: 'hidden',
    width: 64,
  },
  viewerThumbnailActive: {
    borderColor: baseColors.text,
  },
  viewerThumbnailImage: {
    height: '100%',
    width: '100%',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
