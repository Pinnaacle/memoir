import EventEditorScreen from '@/components/EventEditorScreen';
import { type SelectedImage } from '@/components/ui/AddImageField';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useEventDetailQuery, useUpdateEventMutation } from '@/hooks/useEvents';
import { type CreateEventValues } from '@/lib/validation/event';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

function createDateFromDay(dateValue: string): Date {
  const [year, month, day] = dateValue.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date(dateValue);
  }

  return new Date(year, month - 1, day, 12);
}

export default function EditEventScreen() {
  const {
    activeGroup,
    errorMessage: groupError,
    isLoading: isLoadingGroups,
  } = useActiveGroup();
  const updateEventMutation = useUpdateEventMutation();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;
  const eventQuery = useEventDetailQuery(eventId, activeGroup?.id);
  const loadError =
    groupError ??
    (eventQuery.error instanceof Error
      ? eventQuery.error.message
      : eventQuery.error
        ? 'Could not load event.'
        : null);

  if (isLoadingGroups || eventQuery.isPending) {
    return (
      <View style={styles.screenCentered}>
        <ActivityIndicator color={sectionColors.events} />
      </View>
    );
  }

  if (!eventId || loadError || !eventQuery.data) {
    return (
      <View style={styles.screenCentered}>
        <Text style={styles.errorText}>{loadError ?? 'Event not found.'}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backTextButton}
        >
          <Text style={styles.backText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const initialValues = {
    title: eventQuery.data.title,
    occurredAt: createDateFromDay(eventQuery.data.occurredOn),
    location: eventQuery.data.locationText ?? '',
    mood: eventQuery.data.mood ?? 'Romantic',
    notes: eventQuery.data.notes ?? '',
  } satisfies CreateEventValues;
  const initialPhotos: SelectedImage[] = eventQuery.data.photos.map(
    (photo) => ({
      id: photo.id,
      uri: photo.storagePath,
      publicUrl: photo.storagePath,
      storagePath: photo.storagePath,
      uploadStatus: 'uploaded',
    }),
  );

  return (
    <EventEditorScreen
      initialPhotos={initialPhotos}
      initialValues={initialValues}
      key={eventQuery.data.id}
      onSubmit={(input) =>
        updateEventMutation.mutateAsync({
          ...input,
          eventId,
        })
      }
      title="Edit Event"
    />
  );
}

const styles = StyleSheet.create({
  screenCentered: {
    flex: 1,
    backgroundColor: baseColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  errorText: {
    color: baseColors.textError,
    textAlign: 'center',
  },
  backTextButton: {
    marginTop: space.lg,
  },
  backText: {
    color: sectionColors.events,
  },
});
