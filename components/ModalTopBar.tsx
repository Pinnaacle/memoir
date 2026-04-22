import { Text } from '@/components/ui/Text';
import { type SaveState } from '@/lib/interaction';
import { baseColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from './ui/Button';

interface HeaderProps {
  title: string;
  color?: string;
  onClose?: () => void;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveState?: SaveState;
}

export default function Header({
  title,
  color,
  onClose,
  onSave,
  saveDisabled = false,
  saveState = 'idle',
}: HeaderProps) {
  const hasSaveAction = typeof onSave === 'function';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.topBarContainer]}>
        <View style={[styles.spaceDiv, { alignItems: 'flex-start' }]}>
          <Pressable
            accessibilityLabel="Close modal"
            hitSlop={12}
            onPress={onClose}
            style={styles.closeButton}
          >
            <X color={baseColors.text} size={24} />
          </Pressable>
        </View>
        <Text role="heading" style={[styles.title]}>
          {title}
        </Text>
        <View style={[styles.spaceDiv, { alignItems: 'flex-end' }]}>
          {hasSaveAction ? (
            <Button
              alignSelf="flex-end"
              color={color}
              disabled={saveDisabled}
              label="Save"
              onPress={onSave}
              saveState={saveState}
              variant="default"
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: baseColors.bg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  topBarContainer: {
    marginHorizontal: space.lg,
    marginTop: space.xs,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceDiv: {
    width: '30%',
    display: 'flex',
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  title: {
    color: baseColors.text,
    fontSize: textTheme.size.xl,
    fontFamily: textTheme.family.medium,
    alignSelf: 'center',
  },
});
