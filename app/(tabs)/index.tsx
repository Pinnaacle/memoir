import { baseColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { ScrollView, StyleSheet } from 'react-native';

export default function TimelineScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    ></ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xxl * 2,
    gap: space.xl,
  },
  header: {
    gap: space.sm,
  },
  title: {
    textAlign: 'left',
  },
  cardContent: {
    gap: space.md,
  },
});
