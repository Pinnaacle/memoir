import { baseColors } from '@/theme/colors';
import { getSaveLabel, type SaveState } from '@/lib/interaction';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';

interface ButtonProps extends React.ComponentProps<typeof Pressable> {
  label: string;
  variant?: 'default' | 'round';
  color?: string;
  alignSelf?: 'flex-start' | 'flex-end' | 'center';
  saveState?: SaveState;
}

export default function Button({
  label,
  variant = 'default',
  color,
  alignSelf,
  disabled,
  saveState,
  onPress,
  ...rest
}: ButtonProps) {
  const isLocked = disabled || saveState === 'saving' || saveState === 'saved';
  const resolvedLabel = saveState ? getSaveLabel(saveState, label) : label;

  return (
    <Pressable
      {...rest}
      disabled={isLocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles[variant],
        { alignSelf, backgroundColor: color },
        pressed && !isLocked ? styles.pressed : null,
        isLocked ? styles.disabled : null,
      ]}
    >
      {variant === 'round' ? (
        <Plus color={baseColors.bg} size={28} />
      ) : (
        <Text style={styles.text}>{resolvedLabel}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  default: {
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  round: {
    padding: 10,
    borderRadius: 50,
    width: 60,
    aspectRatio: 1 / 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 8px 32px 0 ${baseColors.shadow}, 0 0 16px 0 ${baseColors.shadow}`,
  },
  text: {
    color: baseColors.bg,
  },
  pressed: {
    opacity: 0.80,
  },
  disabled: {
    opacity: 0.45,
  },
});
