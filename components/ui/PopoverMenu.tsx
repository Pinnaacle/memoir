import { Text } from '@/components/ui/Text';
import { baseColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

type PopoverMenuItem = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
};

type PopoverMenuProps = {
  visible: boolean;
  onClose: () => void;
  items: PopoverMenuItem[];
  dismissDisabled?: boolean;
};

export default function PopoverMenu({
  visible,
  onClose,
  items,
  dismissDisabled = false,
}: PopoverMenuProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (!dismissDisabled) {
          onClose();
        }
      }}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          disabled={dismissDisabled}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View style={styles.panel}>
          {items.map((item, index) => (
            <View key={item.label}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                accessibilityRole="button"
                disabled={item.disabled}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.action,
                  pressed ? styles.actionPressed : null,
                  item.disabled ? styles.actionDisabled : null,
                ]}
              >
                <Text
                  style={
                    item.variant === 'danger'
                      ? styles.actionDangerText
                      : styles.actionText
                  }
                >
                  {item.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
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
  action: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  actionPressed: {
    opacity: 0.82,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionText: {
    color: baseColors.text,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  actionDangerText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  divider: {
    backgroundColor: 'rgba(107, 101, 96, 0.12)',
    height: 1,
  },
});
