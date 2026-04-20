import { Card } from '@/components/ui/Card';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_MOMENTS = [
  {
    id: 'm-1',
    title: 'Indflyttergave fra Eline',
    date: 'March 14, 2026',
    type: 'Tiny Joy',
    description: 'Fine kopper fordi vi drikker te konstant',
    coverImage:
      'http://localhost:3845/assets/c55842b0bc85dfc62a3e04b57adac9d9e1d7a026.png',
  },
  {
    id: 'm-2',
    title: 'Madrassen pa gulvet og TV hygge',
    date: 'March 9, 2026',
    type: 'Cozy Scene',
    description: 'Hyggelige stunder med dig, er min yndlings ting',
    coverImage:
      'http://localhost:3845/assets/5993c5c701eb17535f8821b93ed386e895fc9f2e.png',
  },
  {
    id: 'm-3',
    title: 'Valters barnedab',
    date: 'February 1, 2026',
    type: 'Connection',
    description: 'Niko stod fadder - Big day',
    coverImage:
      'http://localhost:3845/assets/b4f30fcb1a5dc666b63246d02bea2c11ba24af34.png',
  },
] as const;

export default function MomentsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {MOCK_MOMENTS.map((moment) => (
          <Card
            key={moment.id}
            color={sectionColors.moments}
            coverImage={moment.coverImage}
            date={moment.date}
            description={moment.description}
            title={moment.title}
            type={moment.type}
            variant="default"
          />
        ))}
      </ScrollView>

      <Link href="/moments/new" asChild>
        <Pressable accessibilityRole="button" style={styles.createButton}>
          <Plus color={baseColors.bg} size={28} strokeWidth={2.4} />
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    gap: space.md + space.xs,
    paddingHorizontal: space.lg,
    paddingBottom: 110,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: sectionColors.moments,
    borderRadius: 999,
    bottom: 96,
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
