import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useMemoryWallQuery } from '@/hooks/useMemoryWall';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text } from '@/theme/type';
import { Image as ExpoImage } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal as ExpoModal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const ITEM_WIDTH = 175;
const COLUMNS = 2;

type MemoryType = 'moment' | 'event' | 'chapter';

interface MemoryItem {
  id: string;
  sourceId: string;
  eventId?: string;
  momentId?: string;
  title: string;
  date: string;
  imageUrl: string | number;
  description: string;
  type: MemoryType;
}

const MEMORY_TYPE_COLORS: Record<MemoryType, string> = {
  moment: sectionColors.moments,
  event: sectionColors.events,
  chapter: sectionColors.chapters,
};

const FALLBACK_COVER_IMAGE = require('@/assets/images/fallbackImage.png');

function formatOccurredOn(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function resolveMemoryHref(item: {
  type?: MemoryType | null;
  sourceId?: string;
  eventId?: string;
  momentId?: string;
}): Href | null {
  if (item.eventId) {
    return `/events/${item.eventId}` as Href;
  }

  if (item.momentId) {
    return `/moments/${item.momentId}` as Href;
  }

  if (!item.sourceId) {
    return null;
  }

  if (item.type === 'event') {
    return `/events/${item.sourceId}` as Href;
  }

  if (item.type === 'moment') {
    return `/moments/${item.sourceId}` as Href;
  }

  return null;
}

export default function MemoriesScreen() {
  const {
    activeGroup,
    errorMessage: groupError,
    isLoading: isLoadingGroups,
  } = useActiveGroup();
  const memoryWallQuery = useMemoryWallQuery(activeGroup?.id);
  const memories: MemoryItem[] = useMemo(() => {
    const mappedItems = (memoryWallQuery.data ?? []).map((item) => ({
      id: item.id,
      sourceId: item.sourceId,
      eventId: item.eventId,
      momentId: item.momentId,
      title: item.title,
      date: formatOccurredOn(item.occurredOn),
      imageUrl: item.imageUrl ?? FALLBACK_COVER_IMAGE,
      description: item.description,
      type: item.type,
    }));

    return shuffleItems(mappedItems);
  }, [memoryWallQuery.data]);
  const loadError =
    groupError ??
    (memoryWallQuery.error instanceof Error
      ? memoryWallQuery.error.message
      : memoryWallQuery.error
        ? 'Failed to load memories.'
        : null);

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
        {!isLoadingGroups && !memoryWallQuery.isPending && !loadError && (
          <Text style={styles.title}>✦ {memories.length} memories ✦</Text>
        )}

        {isLoadingGroups || memoryWallQuery.isPending ? (
          <ActivityIndicator color={sectionColors.memories} />
        ) : null}

        {!isLoadingGroups && !memoryWallQuery.isPending && loadError ? (
          <Text style={styles.errorText}>{loadError}</Text>
        ) : null}

        {!isLoadingGroups &&
        !memoryWallQuery.isPending &&
        !loadError &&
        memories.length === 0 ? (
          <Text style={styles.emptyText}>No memories yet in this space.</Text>
        ) : null}

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
  const href = selectedMemory ? resolveMemoryHref(selectedMemory) : null;

  console.log('Selected Memory:', selectedMemory);
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
            source={
              typeof selectedMemory?.imageUrl === 'string'
                ? { uri: selectedMemory.imageUrl }
                : (selectedMemory?.imageUrl ?? FALLBACK_COVER_IMAGE)
            }
            style={[styles.modalImage]}
          />
          <View style={{ alignItems: 'center', gap: space.xxs }}>
            <Text numberOfLines={1} style={styles.modalTextTitle}>
              {selectedMemory?.title}
            </Text>
            <Text style={styles.modalTextDate}>{selectedMemory?.date}</Text>

            <Text numberOfLines={2} style={styles.modalTextDescription}>
              {selectedMemory?.description}
            </Text>
          </View>

          <Link asChild href={href ? href : '/+not-found'}>
            <Button
              color={MEMORY_TYPE_COLORS[selectedMemory?.type ?? 'moment']}
              variant="default"
              label={`See ${selectedMemory?.type as MemoryType}`}
              onPress={() => setModalVisible(false)}
            />
          </Link>
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
    paddingBottom: space.xl,
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
    boxShadow: `0px 4px 12px 0px ${baseColors.bg}`,
    height: 'auto',
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
    color: baseColors.bg,
    fontFamily: text.family.semiBold,
    lineHeight: text.lineHeight.lg,
    fontSize: text.size.lg,
  },
  modalTextDate: {
    color: baseColors.textSoft,
    fontSize: text.size.xs,
    lineHeight: text.lineHeight.xs,
    fontFamily: text.family.mediumItalic,
  },
  modalTextDescription: {
    color: baseColors.textMuted,
    fontFamily: text.family.regular,
    fontSize: text.size.sm,
    lineHeight: text.lineHeight.sm,
    textAlign: 'center',
  },

  emptyText: {
    color: baseColors.textSoft,
    textAlign: 'center',
  },
  errorText: {
    color: baseColors.textError,
    textAlign: 'center',
  },

  closeButton: {
    fontSize: text.size.xs,
    lineHeight: text.lineHeight.xs,
    fontFamily: text.family.mediumItalic,
    color: baseColors.textSoft,
  },
});
