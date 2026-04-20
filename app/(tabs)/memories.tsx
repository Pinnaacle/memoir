import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text } from '@/theme/type';
import { Image as ExpoImage } from 'expo-image';
import { navigate } from 'expo-router/build/global-state/routing';
import { useState } from 'react';
import {
  Modal as ExpoModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const ITEM_WIDTH = 175;
const COLUMNS = 2;

type MemoryType = 'moment' | 'event' | 'chapter';

interface MemoryItem {
  id: number;
  title: string;
  date: string;
  imageUrl: string;
  type: MemoryType;
}

const MEMORY_TYPE_COLORS: Record<MemoryType, string> = {
  moment: sectionColors.moments,
  event: sectionColors.events,
  chapter: sectionColors.chapters,
};
export default function MemoriesScreen() {
  const memories: MemoryItem[] = [
    {
      id: 1,
      title: 'Beach Vacation',
      date: 'June 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      type: 'moment',
    },
    {
      id: 2,
      title: 'Mountain Hike',
      date: 'September 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80',
      type: 'event',
    },
    {
      id: 3,
      title: 'City Exploration',
      date: 'December 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
      type: 'chapter',
    },
    {
      id: 4,
      title: 'Forest Camping',
      date: 'April 2024',
      imageUrl:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
      type: 'moment',
    },
    {
      id: 5,
      title: 'Desert Road Trip',
      date: 'August 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      type: 'event',
    },
    {
      id: 6,
      title: 'Snowy Getaway',
      date: 'January 2024',
      imageUrl:
        'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80',
      type: 'chapter',
    },
    {
      id: 7,
      title: 'Lakeside Retreat',
      date: 'May 2024',
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      type: 'moment',
    },
    {
      id: 8,
      title: 'Countryside Picnic',
      date: 'July 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80',
      type: 'event',
    },
    {
      id: 9,
      title: 'Urban Art Tour',
      date: 'November 2023',
      imageUrl:
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
      type: 'chapter',
    },
  ];

  const { width } = useWindowDimensions();
  const horizontalPadding = space.lg * 2; // same as your container paddingHorizontal
  const availableWidth = width - horizontalPadding - 1; // subtracting 1 to account for rounding issues
  const gap = (availableWidth - ITEM_WIDTH * COLUMNS) / (COLUMNS - 1);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Modal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedMemory={selectedMemory}
      />

      <View style={styles.container}>
        <Text style={styles.title}>✦ {memories.length} memories ✦</Text>
        <View
          style={[
            styles.memoriesContainer,
            { flexDirection: 'row', alignItems: 'center', gap: gap },
          ]}
        >
          {memories.map((memory) => (
            <Pressable
              key={memory.id}
              onPress={() => {
                setSelectedMemory(memory);
                setModalVisible(true);
              }}
            >
              <Image
                source={memory.imageUrl}
                variant="polaroid"
                polaroid={{
                  color: MEMORY_TYPE_COLORS[memory.type],
                  date: memory.date,
                }}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Modal({
  modalVisible,
  setModalVisible,
  selectedMemory,
}: {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  selectedMemory: MemoryItem | null;
}) {
  return (
    <ExpoModal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(!modalVisible);
      }}
    >
      <Pressable
        style={styles.centeredView}
        onPress={() => setModalVisible(false)}
      >
        <Pressable
          style={[styles.modalView]}
          onPress={(event) => event.stopPropagation()}
        >
          <ExpoImage
            source={{
              uri:
                selectedMemory?.imageUrl ||
                'https://via.placeholder.com/600x400',
            }}
            style={[styles.modalImage]}
          />
          <View style={{ alignItems: 'center', gap: space.xxs }}>
            <Text style={styles.modalTextTitle}>{selectedMemory?.title}</Text>
            <Text style={styles.modalTextDate}>
              {selectedMemory?.date || 'Unknown Date'}
            </Text>
          </View>
          <Button
            color={
              MEMORY_TYPE_COLORS[
                (selectedMemory?.type as MemoryType) || 'moments'
              ]
            }
            variant="default"
            label={`See ${selectedMemory?.type as MemoryType}`}
            onPress={() => {
              navigate(`/${selectedMemory?.type as MemoryType}s#${selectedMemory?.id}`);
              setModalVisible(false);
            }}
            // Handle see memory action, e.g., navigate to detail screen
          />
        </Pressable>
        <View>
          <Text style={styles.closeButton}>Click anywhere to close</Text>
        </View>
      </Pressable>
    </ExpoModal>
  );
}

const styles = StyleSheet.create({
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

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },

  modalView: {
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    height: 'auto',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '100%',
    backgroundColor: baseColors.text,
    padding: 25,
    position: 'relative',
    borderRadius: 4,
    alignItems: 'center',
    gap: space.sm,
  },

  modalImage: {
    width: '100%',
    aspectRatio: 1 / 1,
    objectFit: 'cover',
    borderRadius: 2,
  },

  modalTextTitle: {
    fontFamily: text.family.semiBold,
    lineHeight: text.lineHeight.xl,
    fontSize: text.size.xl,
  },
  modalTextDate: {
    fontSize: text.size.xs,
    lineHeight: text.lineHeight.xs,
    fontFamily: text.family.mediumItalic,
  },

  closeButton: {
    fontSize: text.size.xs,
    lineHeight: text.lineHeight.xs,
    fontFamily: text.family.mediumItalic,
    color: baseColors.textSoft,
  },
});
