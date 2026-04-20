import Image from '@/components/ui/Image';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text } from '@/theme/type';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const ITEM_WIDTH = 175;
const COLUMNS = 2;
export default function MemoriesScreen() {
  const memories = [
    {
      id: 1,
      title: 'Beach Vacation',
      date: 'June 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 2,
      title: 'Mountain Hike',
      date: 'September 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 3,
      title: 'City Exploration',
      date: 'December 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const { width } = useWindowDimensions();
  const horizontalPadding = space.lg * 2; // same as your container paddingHorizontal
  const availableWidth = width - horizontalPadding;
  const gap = (availableWidth - ITEM_WIDTH * COLUMNS) / (COLUMNS - 1);
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>✦ {memories.length} memories ✦</Text>
        <View
          style={[
            styles.memoriesContainer,
            { flexDirection: 'row', alignItems: 'center', gap: gap },
          ]}
        >
          {memories.map((memory) => (
            <Image
              key={memory.id}
              source={memory.imageUrl}
              variant="polaroid"
              polaroid={{ color: '#2fe', date: memory.date }}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
  },
  container: {
    flex: 1,
    backgroundColor: baseColors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.md,
  },
  title: {
    color: sectionColors.memories,
    fontSize: text.size.xl,
    fontFamily: text.family.semiBold,
    marginBottom: 10,
  },
  memoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
