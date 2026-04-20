import { Text } from '@/components/ui/Text';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

export default function MomentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.centerText}>Moments</Text>

      <Link href="/moments/new" asChild>
        <Pressable accessibilityRole="button" style={styles.createButton}>
          <Plus color={baseColors.bg} size={28} strokeWidth={2.4} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: baseColors.bg,
    justifyContent: 'center',
  },
  centerText: {
    color: sectionColors.moments,
    fontFamily: textTheme.family.bold,
    fontSize: textTheme.size.xl,
    lineHeight: textTheme.lineHeight.xl,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: sectionColors.moments,
    borderRadius: 999,
    bottom: space.xxl,
    height: 60,
    width: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: space.xl,
    shadowColor: baseColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
});
