import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import { Text } from './Text';

export type ImageUploadStatus = 'local' | 'uploading' | 'uploaded' | 'failed';

const DEFAULT_MAX_IMAGES = 6;
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
  publicUrl?: string | null;
  uploadStatus?: ImageUploadStatus;
};

interface AddImageFieldProps extends ViewProps {
  value: SelectedImage[];
  onChange: (next: SelectedImage[]) => void;
  label?: string;
  color?: string;
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
    publicUrl: null,
    uploadStatus: 'local',
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
  allowsMultipleSelection = true,
  maxImages = DEFAULT_MAX_IMAGES,
  disabled = false,
  onRequestUpload,
  style,
  ...rest
}: AddImageFieldProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const images = value.slice(0, maxImages);
  const remainingSlots = Math.max(maxImages - images.length, 0);
  const canAddMore = remainingSlots > 0;
  const isDisabled = disabled || isPicking;
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

  async function ensureMediaPermission() {
    if (Platform.OS === 'web') {
      return true;
    }

    const currentPermission =
      await ImagePicker.getMediaLibraryPermissionsAsync();

    if (currentPermission.granted) {
      return true;
    }

    const nextPermission = currentPermission.canAskAgain
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : currentPermission;

    if (nextPermission.granted) {
      return true;
    }

    Alert.alert(
      'Photo access needed',
      'Allow photo library access to add images to this event.',
    );
    return false;
  }

  async function handleAddImages() {
    if (isDisabled || !canAddMore) {
      return;
    }

    setIsPicking(true);

    try {
      const hasPermission = await ensureMediaPermission();

      if (!hasPermission) {
        return;
      }

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
      Alert.alert('Could not open photos', 'Please try again in a moment.');
    } finally {
      setIsPicking(false);
    }
  }

  function handleRemoveImage(imageId: string) {
    onChange(images.filter((image) => image.id !== imageId));
  }

  return (
    <View {...rest} style={[styles.field, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {label} <Text style={styles.count}>({images.length})</Text>
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
        <View onLayout={handleGridLayout} style={styles.grid}>
          {images.map((image) => (
            <View
              key={image.id}
              style={[styles.gridItem, { height: itemSize, width: itemSize }]}
            >
              <Image
                source={{ uri: image.publicUrl ?? image.uri }}
                style={styles.preview}
                contentFit="cover"
              />
              <Pressable
                accessibilityHint="Removes this photo from the event draft"
                accessibilityLabel={`Remove ${image.fileName ?? 'photo'}`}
                accessibilityRole="button"
                hitSlop={space.sm}
                onPress={() => handleRemoveImage(image.id)}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <X color={baseColors.text} size={14} strokeWidth={2.25} />
              </Pressable>
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
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
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
