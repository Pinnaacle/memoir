import { Card } from '@/components/ui/Card';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
interface MemoryItem {
  id: number;
  title: string;
  date: string;
  imageUrl: string;
  description: string;
  type?: string;
}

export default function TimelineScreen() {
  const pageColor = sectionColors.timeline;
  const memories: MemoryItem[] = [
    {
      id: 1,
      title: 'Beach Vacation',
      date: 'June 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      type: 'Special Moment',
    },
    {
      id: 2,
      title: 'Mountain Hike',
      date: 'September 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      type: 'Special Moment',
    },
    {
      id: 3,
      title: 'City Exploration',
      date: 'December 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      type: 'Special Moment',
    },
    {
      id: 4,
      title: 'Forest Camping',
      date: 'April 2024',
      imageUrl:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      type: 'Special Moment',
    },
    {
      id: 5,
      title: 'Desert Road Trip',
      date: 'August 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      type: 'Special Moment',
    },
    {
      id: 6,
      title: 'Snowy Getaway',
      date: 'January 2024',
      imageUrl:
        'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      type: 'Special Moment',
    },
    {
      id: 7,
      title: 'Lakeside Retreat',
      date: 'May 2024',
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      type: 'Special Moment',
    },
    {
      id: 8,
      title: 'Countryside Picnic',
      date: 'July 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      type: 'Special Moment',
    },
    {
      id: 9,
      title: 'Urban Art Tour',
      date: 'November 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      type: 'Special Moment',
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.timeline}></View>
        <View style={[styles.memoriesContainer]}>
          {memories.map((memory) => (
            <View style={{ position: 'relative' }} key={memory.id}>
              <View style={styles.indicator}></View>
              <Link href={`/moments#${memory.id}`}>
                <Card
                  variant="default"
                  title={memory.title}
                  date={memory.date}
                  coverImage={memory.imageUrl}
                  color={pageColor}
                  description={memory.description}
                  type={memory.type}
                />
              </Link>
            </View>
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
    paddingVertical: space.xl,
    paddingHorizontal: space.xl,
  },
  timeline: {
    height: '100%',
    width: 2,
    backgroundColor: sectionColors.timeline,
    opacity: 0.4,
  },
  indicator: {
    height: 10,
    aspectRatio: 1 / 1,
    backgroundColor: sectionColors.timeline,
    borderRadius: 5,
    boxShadow: `0px 0px 8px 0px ${sectionColors.timeline}`,
    position: 'absolute',
    top: 20,
    left: -space.md,
    transform: [{ translateX: -6 }],
  },

  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: baseColors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.md,
  },

  memoriesContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.lg,
    width: '100%',
  },
});
