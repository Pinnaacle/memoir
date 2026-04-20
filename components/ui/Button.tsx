import { baseColors } from '@/theme/colors';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';

interface ButtonProps extends React.ComponentProps<typeof Pressable> {
  label: string;
  variant?: 'default' | 'round';
  color?: string;
}

export default function Button({
  label,
  variant = 'default',
  color,
  ...rest
}: ButtonProps) {
  return (
    <Pressable {...rest} style={[styles[variant], { backgroundColor: color }]}>
      {variant === 'round' ? (
        <Plus color={baseColors.bg} size={28} />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  default: {
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 8,
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
});
