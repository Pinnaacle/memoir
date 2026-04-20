import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { usePathname } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from './Text';

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  color?: string;
  style?: ViewStyle;
};

export function Dropdown({
  options,
  value,
  defaultValue,
  placeholder,
  onChange,
  color,
  style,
}: DropdownProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;

  const resolvedPlaceholder = useMemo(() => {
    if (placeholder) {
      return placeholder;
    }

    if (pathname.includes('/events')) {
      return 'Event type';
    }

    if (pathname.includes('/chapters')) {
      return 'Chapter type';
    }

    return 'Moment type';
  }, [pathname, placeholder]);

  const resolvedColor = useMemo(() => {
    if (color) {
      return color;
    }

    if (pathname.includes('/events')) {
      return sectionColors.events;
    }

    if (pathname.includes('/chapters')) {
      return sectionColors.chapters;
    }

    if (pathname.includes('/moments')) {
      return sectionColors.moments;
    }

    return sectionColors.timeline;
  }, [color, pathname]);

  const selectedLabel = useMemo(
    () =>
      options.find((option) => option.value === selectedValue)?.label ??
      resolvedPlaceholder,
    [options, resolvedPlaceholder, selectedValue],
  );

  function handleSelect(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
    setIsOpen(false);
  }

  return (
    <View style={[styles.root, style]}>
      {isOpen ? (
        <View style={styles.panel}>
          {options.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={({ pressed }) => [
                styles.optionRow,
                pressed ? styles.optionRowPressed : null,
              ]}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: resolvedColor },
          pressed ? styles.triggerPressed : null,
        ]}
      >
        <Text style={styles.triggerText}>{selectedLabel}</Text>
        <View
          style={[styles.chevronSlot, isOpen ? styles.chevronSlotOpen : null]}
        >
          <ChevronDown color={baseColors.bg} size={20} strokeWidth={2.25} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 36,
    position: 'relative',
    width: '100%',
  },
  trigger: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.full,
    flexDirection: 'row',
    height: 36,
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    position: 'relative',
    elevation: 2,
    zIndex: 2,
  },
  triggerPressed: {
    opacity: 0.92,
  },
  triggerText: {
    color: baseColors.bg,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  panel: {
    backgroundColor: baseColors.card,
    borderCurve: 'continuous',
    borderRadius: 18,
    left: 0,
    paddingBottom: 12,
    paddingHorizontal: space.lg,
    paddingTop: 42,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  optionRow: {
    borderCurve: 'continuous',
    borderRadius: radius.sm,
    paddingVertical: 2,
  },
  optionRowPressed: {
    opacity: 0.75,
  },
  optionText: {
    color: baseColors.text,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
  },
  chevronSlot: {
    alignItems: 'center',
    flexShrink: 0,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  chevronSlotOpen: {
    transform: [{ rotate: '180deg' }],
  },
});
