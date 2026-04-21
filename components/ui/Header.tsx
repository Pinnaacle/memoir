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
  height?: number;
}

export const TAB_HEADER_CONTENT_HEIGHT = 88;

export default function Header({ title, tagLine, color, height }: HeaderProps) {
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, height ? { height } : null]}
    >
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text
            aria-level={1}
            role="heading"
            style={[styles.title, { color: color ?? baseColors.text }]}
          >
            {title}
          </Text>
          <CircleUser color={baseColors.text} size={24} />
        </View>
        {tagLine && <Text style={styles.tagLine}>{tagLine}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: baseColors.bg,
    paddingTop: space.lg,
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
