import { Text } from '@/components/ui/Text';
import { baseColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text } from '@/theme/type';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function NewEventScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.hero}>
        <Text style={styles.title}>Create a new memory</Text>
        <Text style={styles.description}>
          This page is intentionally simplified so the route has a clean
          starting point before the full event flow is rebuilt.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  hero: {
    gap: space.sm,
    paddingBottom: space.sm,
  },
  title: {
    color: baseColors.text,
    fontFamily: text.family.bold,
    fontSize: text.size.xl,
    lineHeight: text.lineHeight.xl,
  },
  description: {
    color: baseColors.textSoft,
    fontFamily: text.family.regular,
    fontSize: text.size.md,
    lineHeight: 24,
  },
});
