import { MAX_IMAGES_PER_UPLOAD } from '@/lib/images';
import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { AlertTriangle, Camera, Plus, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import { FullscreenImageViewer } from './FullscreenImageViewer';
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
  showRemoveButton?: boolean;
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

async function pickImagesFromLibrary(options: {
  allowsMultipleSelection: boolean;
  selectionLimit: number;
}): Promise<{ images: SelectedImage[]; didFail: boolean }> {
  try {
    // Expo returns local file URIs; the upload hook stores them in Supabase.
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: options.allowsMultipleSelection,
      mediaTypes: ['images'],
      quality: 1,
      selectionLimit: options.selectionLimit,
    });

    if (result.canceled || !result.assets?.length) {
      return { images: [], didFail: false };
    }

    return {
      images: result.assets.map(createSelectedImage),
      didFail: false,
    };
  } catch {
    return { images: [], didFail: true };
  }
}

export function AddImageField({
  value,
  onChange,
  label = 'Photos',
  color = sectionColors.events,
  editable,
  showRemoveButton,
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
  const isEditable = editable ?? Boolean(onChange);
  const showsRemoveButton = isEditable && (showRemoveButton ?? true);
  const limit =
    maxImages ??
    (isEditable ? DEFAULT_MAX_IMAGES : value.length || DEFAULT_MAX_IMAGES);
  const images = value.slice(0, limit);
  const imageCount = value.length;
  const slotsLeft = Math.max(limit - images.length, 0);
  const canAddMore = isEditable && slotsLeft > 0;
  const isDisabled = disabled || isPicking || !isEditable;
  const itemSize =
    gridWidth > GRID_GAP * (GRID_COLUMNS - 1)
      ? (gridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS
      : 0;

  function handleGridLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.round(event.nativeEvent.layout.width);

    setGridWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  }

  function showPhotoLimitAlert() {
    Alert.alert('Photo limit reached', `You can attach up to ${limit} photos.`);
  }

  function getImagesToAdd(pickedImages: SelectedImage[]) {
    return getNewImages(images, pickedImages).slice(0, slotsLeft);
  }




  async function handleAddImages() {
    // 1. Only editable fields can open the image picker.
    if (!isEditable || !onChange || isDisabled) {
      return;
    }

    // 2. Respect the maximum number of images for this form.
    if (!canAddMore) {
      showPhotoLimitAlert();
      return;
    }

    // 3. Open Expo's native image picker.
    setIsPicking(true);

    try {
      const picked = await pickImagesFromLibrary({
        allowsMultipleSelection: allowsMultipleSelection && slotsLeft > 1,
        selectionLimit: slotsLeft,
      });

      if (picked.didFail) {
        Alert.alert('Could not open photos');
        return;
      }

      // 4. Ignore duplicate images and anything over the limit.
      const addedImages = getImagesToAdd(picked.images);

      if (addedImages.length === 0) {
        return;
      }

      // 5. Update the preview immediately.
      const nextImages = [...images, ...addedImages];
      onChange(nextImages);

      // 6. Let the parent hook start uploading the new images.
      onRequestUpload?.(addedImages);
    } finally {
      setIsPicking(false);
    }
  }




  function handleOpenViewer(index: number) {
    if (!images[index]) {
      return;
    }

    setActiveImageIndex(index);
  }

  const handleCloseViewer = useCallback(() => {
    setActiveImageIndex(null);
  }, []);

  function handleRemoveImage(imageId: string) {
    if (!isEditable || !onChange || disabled || isPicking) {
      return;
    }

    onChange(images.filter((image) => image.id !== imageId));
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
            accessibilityLabel={`Add a photo to ${label}`}
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

              {showsRemoveButton ? (
                <Pressable
                  accessibilityHint="Removes this photo"
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

      <FullscreenImageViewer
        images={images}
        initialIndex={activeImageIndex}
        onClose={handleCloseViewer}
      />
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
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
