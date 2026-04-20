import { Text } from '@/components/ui/Text';
import { baseColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { CircleUser } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  tagLine?: string;
  color?: string;
}

export default function Header({ title, tagLine, color }: HeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.headerContainer]}>
        <View style={[styles.titleContainer]}>
          <Text
            role="heading"
            style={[styles.title, { color: color ?? baseColors.text }]}
          >
            {title}
          </Text>
          <CircleUser color={baseColors.text} size={24} />
        </View>
        {tagLine && <Text style={[styles.tagLine]}>{tagLine}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: baseColors.bg,
    top: 16,
  },
  headerContainer: {
    marginBottom: space.lg,
    marginHorizontal: space.lg,
    gap: space.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: space.sm,
  },
  title: {
    color: baseColors.text,
    fontSize: textTheme.size.xl,
    fontFamily: textTheme.family.bold,
  },
  tagLine: {
    color: baseColors.textSoft,
    fontSize: textTheme.size.sm,
    fontFamily: textTheme.family.regularItalic,
  },
});
