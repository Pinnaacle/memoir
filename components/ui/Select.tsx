import { baseColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Check, ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from './Text';

export type SelectOption = {
  label: string;
  value: string;
  description?: string;
};

type SelectProps = {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  color?: string;
  style?: ViewStyle;
  label?: string;
  required?: boolean;
  sheetTitle?: string;
  size?: 'compact' | 'default' | 'header';
  disabled?: boolean;
};

function animateDrawerOpen(drawerProgress: SharedValue<number>) {
  drawerProgress.value = 0;
  drawerProgress.value = withTiming(1, {
    duration: 260,
    easing: Easing.out(Easing.cubic),
  });
}

function animateDrawerClose(
  drawerProgress: SharedValue<number>,
  onCloseComplete: () => void,
) {
  drawerProgress.value = withTiming(
    0,
    {
      duration: 220,
      easing: Easing.in(Easing.cubic),
    },
    (finished) => {
      if (finished) {
        runOnJS(onCloseComplete)();
      }
    },
  );
}

function useDrawerAnimation(
  windowHeight: number,
  onCloseComplete: () => void,
) {
  const drawerProgress = useSharedValue(0);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drawerProgress.value, [0, 1], [0, 1]),
  }));

  const sheetAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: interpolate(
            drawerProgress.value,
            [0, 1],
            [windowHeight, 0],
          ),
        },
      ],
    }),
    [windowHeight],
  );

  function openDrawer() {
    animateDrawerOpen(drawerProgress);
  }

  function closeDrawer() {
    animateDrawerClose(drawerProgress, onCloseComplete);
  }

  return {
    backdropAnimatedStyle,
    sheetAnimatedStyle,
    openDrawer,
    closeDrawer,
  };
}

export function Select({
  options,
  value,
  placeholder = 'Select an option',
  onChange,
  color = baseColors.text,
  style,
  label,
  required,
  sheetTitle,
  size = 'default',
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const selectedValue = value;
  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue) ?? null,
    [options, selectedValue],
  );
  const { backdropAnimatedStyle, sheetAnimatedStyle, openDrawer, closeDrawer } =
    useDrawerAnimation(windowHeight, () => setIsOpen(false));

  function handleSelect(nextValue: string) {
    onChange?.(nextValue);
    closeDrawer();
  }

  const triggerTextColor = selectedOption ? baseColors.text : baseColors.textSoft;
  const isCompactTrigger = size === 'compact' || size === 'header';

  return (
    <View style={style}>
      {label ? (
        <Text style={styles.fieldLabel}>
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: isOpen }}
        disabled={disabled}
        onPress={() => {
          if (isOpen) {
            return;
          }

          setIsOpen(true);
          openDrawer();
        }}
        style={({ pressed }) => [
          styles.trigger,
          size === 'compact' ? styles.triggerCompact : null,
          size === 'header' ? styles.triggerHeader : null,
          {
            borderColor: isOpen ? color : 'rgba(255, 255, 255, 0.08)',
          },
          pressed && !disabled ? styles.triggerPressed : null,
          disabled ? styles.triggerDisabled : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            isCompactTrigger ? styles.triggerTextCompact : null,
            size === 'header' ? styles.triggerTextHeader : null,
            { color: triggerTextColor },
          ]}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <View
          style={{
            transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
          }}
        >
          <ChevronDown
            color={baseColors.text}
            size={size === 'header' ? 16 : 20}
            strokeWidth={2.2}
          />
        </View>
      </Pressable>

      <Modal
        onRequestClose={closeDrawer}
        transparent
        visible={isOpen}
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.overlay, backdropAnimatedStyle]}>
            <Pressable
              accessibilityRole="button"
              onPress={closeDrawer}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          <Animated.View style={[styles.sheet, sheetAnimatedStyle]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {sheetTitle ?? label ?? placeholder}
              </Text>
            </View>

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.optionList}
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => {
                const isSelected = option.value === selectedValue;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected
                        ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.07)',
                            borderColor: color,
                          }
                        : null,
                      pressed ? styles.optionRowPressed : null,
                    ]}
                  >
                    <View style={styles.optionTextWrap}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected ? { color } : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.description ? (
                        <Text style={styles.optionDescription}>
                          {option.description}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.optionIndicator,
                        isSelected
                          ? { backgroundColor: color, borderColor: color }
                          : null,
                      ]}
                    >
                      {isSelected ? (
                        <Check color={baseColors.bg} size={14} strokeWidth={3} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.lg,
    marginBottom: space.sm,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderCurve: 'continuous',
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: space.xl,
  },
  triggerCompact: {
    minHeight: 52,
    paddingHorizontal: space.lg,
  },
  triggerHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.full,
    minHeight: 34,
    maxWidth: 132,
    minWidth: 88,
    paddingHorizontal: space.md,
  },
  triggerPressed: {
    opacity: 0.92,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    flex: 1,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.lg,
    marginRight: space.md,
  },
  triggerTextCompact: {
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    marginRight: space.sm,
  },
  triggerTextHeader: {
    fontFamily: textTheme.family.semiBold,
    textAlign: 'center',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    backgroundColor: '#232220',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '72%',
    paddingBottom: space.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(245, 240, 236, 0.16)',
    borderRadius: radius.full,
    height: 5,
    marginBottom: space.md,
    width: 52,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: space.md,
  },
  sheetTitle: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.lg,
    textAlign: 'center',
  },
  optionList: {
    gap: space.sm,
    paddingBottom: space.md,
  },
  optionRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.md,
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md + space.xxs,
  },
  optionRowPressed: {
    opacity: 0.88,
  },
  optionTextWrap: {
    flex: 1,
    gap: space.xs,
  },
  optionLabel: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
  optionDescription: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  optionIndicator: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
});
