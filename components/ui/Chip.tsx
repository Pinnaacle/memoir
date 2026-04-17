import { baseColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Pressable, StyleSheet, Text } from 'react-native';

interface ChipProps {
  label: string;
  color: string;
  isSelected?: boolean;
  setIsSelected?: (selected: boolean) => void;
  style: any;
}

export default function Chip({
  label,
  color,
  isSelected,
  setIsSelected,
  style,
}: ChipProps) {
  return (
    <Pressable
      onPress={() => setIsSelected && setIsSelected(!isSelected)}
      style={[
        style,
        isSelected ? styles.chipSelected : styles.chip,
        { backgroundColor: isSelected ? color : 'rgb(255, 255, 255, 0.5)' },
      ]}
    >
      <Text style={isSelected ? styles.selectedLabel : styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderColor: 'rgb(107, 101, 96, 0.19)',
    borderWidth: 1,
  },
  chipSelected: {
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderColor: 'transparent',
    borderWidth: 1,
  },
  label: {
    color: baseColors.textSoft,
    fontSize: textTheme.size.sm,
    fontFamily: textTheme.family.semiBold,
  },
  selectedLabel: {
    color: baseColors.bg,
    fontSize: textTheme.size.sm,
    fontFamily: textTheme.family.semiBold,
  },
});
