import { baseColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import {
  ImageZoom,
  type ImageZoomRef,
} from '@likashefqet/react-native-image-zoom';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Image as NativeImage,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type { SelectedImage } from './AddImageField';

const HORIZONTAL_PADDING = space.lg;
const CLOSE_BUTTON_SIZE = 36;
const REOPEN_COOLDOWN_MS = 300;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1000;
const DISMISS_ACTIVE_OFFSET_Y = 12;
const DISMISS_FAIL_OFFSET_X = 28;

type ImageDimensions = {
  width: number;
  height: number;
};

type FullscreenImageViewerProps = {
  images: SelectedImage[];
  initialIndex: number | null;
  onClose: () => void;
};

type ViewerSlideProps = {
  bottomInset: number;
  image: SelectedImage;
  isActive: boolean;
  onResolveDimensions: (imageId: string, dimensions: ImageDimensions) => void;
  onZoomStateChange: (isZoomed: boolean) => void;
  resolvedDimensions: ImageDimensions | null;
  viewerAvailableHeight: number;
  viewerAvailableWidth: number;
  windowWidth: number;
};

function getImageDimensions(
  image: SelectedImage | null,
  resolvedDimensions: ImageDimensions | null,
): ImageDimensions | null {
  if (!image) {
    return null;
  }

  if (image.width && image.height) {
    return {
      width: image.width,
      height: image.height,
    };
  }

  return resolvedDimensions;
}

function getContainedImageSize(
  dimensions: ImageDimensions | null,
  maxWidth: number,
  maxHeight: number,
): ImageDimensions {
  if (maxWidth <= 0 || maxHeight <= 0) {
    return { width: 0, height: 0 };
  }

  if (!dimensions) {
    return { width: maxWidth, height: maxHeight };
  }

  const scale = Math.min(
    maxWidth / dimensions.width,
    maxHeight / dimensions.height,
  );

  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
  };
}

function ViewerSlide({
  bottomInset,
  image,
  isActive,
  onResolveDimensions,
  onZoomStateChange,
  resolvedDimensions,
  viewerAvailableHeight,
  viewerAvailableWidth,
  windowWidth,
}: ViewerSlideProps) {
  const zoomRef = useRef<ImageZoomRef>(null);
  const imageDimensions = getImageDimensions(image, resolvedDimensions);
  const viewerImageSize = getContainedImageSize(
    imageDimensions,
    viewerAvailableWidth,
    viewerAvailableHeight,
  );

  const syncZoomState = useCallback(() => {
    if (!isActive) {
      return;
    }

    const scale = zoomRef.current?.getInfo().transformations.scale ?? 1;

    onZoomStateChange(scale > 1.01);
  }, [isActive, onZoomStateChange]);

  useEffect(() => {
    if (imageDimensions || !image.uri) {
      return;
    }

    let isActiveRequest = true;

    NativeImage.getSize(
      image.uri,
      (width, height) => {
        if (!isActiveRequest) {
          return;
        }

        onResolveDimensions(image.id, { width, height });
      },
      () => {
        if (!isActiveRequest) {
          return;
        }

        onResolveDimensions(image.id, {
          width: viewerAvailableWidth || 1,
          height: viewerAvailableHeight || 1,
        });
      },
    );

    return () => {
      isActiveRequest = false;
    };
  }, [
    image.id,
    image.uri,
    imageDimensions,
    onResolveDimensions,
    viewerAvailableHeight,
    viewerAvailableWidth,
  ]);

  useEffect(() => {
    if (isActive) {
      syncZoomState();
      return;
    }

    zoomRef.current?.reset();
  }, [isActive, syncZoomState]);

  return (
    <View style={[styles.viewerSlide, { width: windowWidth }]}>
      <View
        style={[
          styles.viewerImageFrame,
          { paddingBottom: bottomInset + space.xl },
        ]}
      >
        <ImageZoom
          ref={zoomRef}
          isDoubleTapEnabled
          maxScale={4}
          minScale={1}
          onInteractionEnd={syncZoomState}
          onResetAnimationEnd={() => {
            if (!isActive) {
              return;
            }

            onZoomStateChange(false);
          }}
          resizeMode="contain"
          style={[
            styles.viewerImage,
            {
              height: viewerImageSize.height,
              width: viewerImageSize.width,
            },
          ]}
          uri={image.uri}
        />
      </View>
    </View>
  );
}

export function FullscreenImageViewer({
  images,
  initialIndex,
  onClose,
}: FullscreenImageViewerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, ImageDimensions>
  >({});
  const activeIndexRef = useRef<number | null>(null);
  const reopenBlockedUntilRef = useRef(0);
  const listRef = useRef<FlatList<SelectedImage>>(null);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const isVisible = initialIndex !== null;
  const viewerAvailableWidth = Math.max(
    windowWidth - HORIZONTAL_PADDING * 2,
    0,
  );
  const viewerAvailableHeight = Math.max(
    windowHeight -
      insets.top -
      insets.bottom -
      CLOSE_BUTTON_SIZE -
      space.xl * 3,
    0,
  );
  const backdropAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(
        Math.abs(translateY.value),
        [0, DISMISS_DISTANCE * 1.5],
        [1, 0.45],
        Extrapolation.CLAMP,
      ),
    }),
    [],
  );
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (initialIndex === null) {
      activeIndexRef.current = null;
      setActiveIndex(null);
      setIsZoomed(false);
      translateY.value = 0;
      return;
    }

    if (initialIndex < 0 || initialIndex > images.length - 1) {
      onClose();
      return;
    }

    activeIndexRef.current = initialIndex;
    setActiveIndex(initialIndex);
    setIsZoomed(false);
    translateY.value = 0;
  }, [images.length, initialIndex, onClose, translateY]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    if (images.length === 0) {
      onClose();
      return;
    }

    if (activeIndex > images.length - 1) {
      const nextIndex = images.length - 1;

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      return;
    }

    activeIndexRef.current = activeIndex;
  }, [activeIndex, images.length, onClose]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        animated: false,
        offset: windowWidth * activeIndex,
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [activeIndex, windowWidth]);

  const handleResolveDimensions = useCallback(
    (imageId: string, dimensions: ImageDimensions) => {
      setImageDimensions((current) => {
        const existing = current[imageId];

        if (
          existing &&
          existing.width === dimensions.width &&
          existing.height === dimensions.height
        ) {
          return current;
        }

        return {
          ...current,
          [imageId]: dimensions,
        };
      });
    },
    [],
  );

  function handleClose() {
    reopenBlockedUntilRef.current = Date.now() + REOPEN_COOLDOWN_MS;
    activeIndexRef.current = null;
    setIsZoomed(false);
    translateY.value = 0;
    onClose();
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const currentActiveIndex = activeIndexRef.current;

    if (windowWidth <= 0) {
      return;
    }

    if (
      currentActiveIndex === null ||
      Date.now() < reopenBlockedUntilRef.current
    ) {
      return;
    }

    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / windowWidth,
    );

    if (!images[nextIndex] || nextIndex === currentActiveIndex) {
      return;
    }

    setIsZoomed(false);
    translateY.value = 0;
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
  }

  const dismissGesture = Gesture.Pan()
    .enabled(activeIndex !== null && !isZoomed)
    .maxPointers(1)
    .activeOffsetY([-DISMISS_ACTIVE_OFFSET_Y, DISMISS_ACTIVE_OFFSET_Y])
    .failOffsetX([-DISMISS_FAIL_OFFSET_X, DISMISS_FAIL_OFFSET_X])
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const shouldClose =
        Math.abs(event.translationY) >= DISMISS_DISTANCE ||
        Math.abs(event.velocityY) >= DISMISS_VELOCITY;

      if (shouldClose) {
        runOnJS(handleClose)();
        return;
      }

      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 220,
      });
    });

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={isVisible}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.overlay}>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, backdropAnimatedStyle]}
          />
          <Pressable
            accessibilityHint="Closes the photo viewer"
            accessibilityLabel="Close photo viewer"
            accessibilityRole="button"
            onPress={handleClose}
            style={StyleSheet.absoluteFill}
          />

          <GestureDetector gesture={dismissGesture}>
            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              <SafeAreaView edges={['bottom']} style={styles.safeArea}>
                <View
                  style={[styles.topBar, { paddingTop: insets.top + space.lg }]}
                >
                  <Pressable
                    accessibilityHint="Closes the photo viewer"
                    accessibilityLabel="Close photo viewer"
                    accessibilityRole="button"
                    hitSlop={space.sm}
                    onPress={handleClose}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <X color={baseColors.text} size={18} strokeWidth={2.25} />
                  </Pressable>
                </View>

                <FlatList
                  ref={listRef}
                  data={images}
                  getItemLayout={(_, index) => ({
                    index,
                    length: windowWidth,
                    offset: windowWidth * index,
                  })}
                  horizontal
                  keyExtractor={(image) => image.id}
                  onMomentumScrollEnd={handleScrollEnd}
                  pagingEnabled
                  removeClippedSubviews={false}
                  renderItem={({ item, index }) => (
                    <ViewerSlide
                      bottomInset={insets.bottom}
                      image={item}
                      isActive={index === activeIndex}
                      onResolveDimensions={handleResolveDimensions}
                      onZoomStateChange={setIsZoomed}
                      resolvedDimensions={imageDimensions[item.id] ?? null}
                      viewerAvailableHeight={viewerAvailableHeight}
                      viewerAvailableWidth={viewerAvailableWidth}
                      windowWidth={windowWidth}
                    />
                  )}
                  scrollEnabled={!isZoomed}
                  showsHorizontalScrollIndicator={false}
                  style={styles.pager}
                />
              </SafeAreaView>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gestureRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 13, 12, 0.96)',
  },
  content: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: space.lg,
  },
  pager: {
    flex: 1,
  },
  viewerSlide: {
    flex: 1,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 240, 236, 0.08)',
    borderColor: 'rgba(245, 240, 236, 0.16)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: CLOSE_BUTTON_SIZE,
    justifyContent: 'center',
    width: CLOSE_BUTTON_SIZE,
  },
  viewerImageFrame: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    width: '100%',
  },
  viewerImage: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.82,
  },
});
