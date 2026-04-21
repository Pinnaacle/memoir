import { GroupScopePicker } from '@/components/GroupScopePicker';
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

export const TAB_HEADER_CONTENT_HEIGHT = 108;

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
          <View style={styles.actions}>
            <GroupScopePicker
              color={color ?? baseColors.text}
              sheetTitle="Switch space"
              size="header"
            />
            <CircleUser color={baseColors.text} size={24} />
          </View>
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
    marginBottom: space.md,
    marginHorizontal: space.lg,
    gap: space.sm,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: space.xs,
  },
  title: {
    color: baseColors.text,
    fontSize: textTheme.size.xxl,
    fontFamily: textTheme.family.bold,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  tagLine: {
    color: baseColors.textSoft,
    fontSize: textTheme.size.md,
    fontFamily: textTheme.family.regularItalic,
  },
});
