import { Text } from '@/components/ui/Text';
import { baseColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from './Button';

interface HeaderProps {
  title: string;
  color?: string;
}

export default function Header({ title, color }: HeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.topBarContainer]}>
        <View style={[styles.spaceDiv, { alignItems: 'flex-start' }]}>
          <X color={baseColors.text} size={24} />
        </View>
        <Text role="heading" style={[styles.title]}>
          {title}
        </Text>
        <View style={[styles.spaceDiv, { alignItems: 'flex-end' }]}>
          <Button color={color} label="Save" variant="default" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: baseColors.bg,
    top: 16,
  },
  topBarContainer: {
    marginHorizontal: space.lg,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceDiv: {
    width: '30%',
    display: 'flex',
  },
  title: {
    color: baseColors.text,
    fontSize: textTheme.size.lg,
    fontFamily: textTheme.family.medium,
    alignSelf: 'center',
  },
});
