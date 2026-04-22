import EventForm from '@/components/EventForm';
import ModalTopBar from '@/components/ModalTopBar';
import { type SelectedImage } from '@/components/ui/AddImageField';
import Divider from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useEventDetailQuery } from '@/hooks/useEvents';
import { type CreateEventValues } from '@/lib/validation/event';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import {
  router,
  useGlobalSearchParams,
  useLocalSearchParams,
} from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMPTY_VALUES: CreateEventValues = {
  title: '',
  occurredAt: new Date(),
  location: '',
  mood: 'Romantic',
  notes: '',
};

function getParamValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseOccurredAt(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  if ([year, month, day].every((part) => Number.isFinite(part))) {
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getInitialValues(event: {
  title: string;
  occurredOn: string;
  locationText: string | null;
  mood: string | null;
  notes: string | null;
}): CreateEventValues {
  return {
    title: event.title,
    occurredAt: parseOccurredAt(event.occurredOn),
    location: event.locationText ?? '',
    mood: event.mood ?? 'Romantic',
    notes: event.notes ?? '',
  };
}

function getInitialPhotos(
  photos: { storagePath: string; url: string }[],
): SelectedImage[] {
  return photos.map((photo) => ({
    id: photo.storagePath,
    uri: photo.url,
    fileName: photo.storagePath.split('/').pop() ?? null,
    storagePath: photo.storagePath,
    uploadStatus: 'uploaded',
    uploadError: null,
  }));
}

export default function NewEventScreen() {
  const { activeGroup, isLoading: isLoadingGroups } = useActiveGroup();
  const localParams = useLocalSearchParams<{
    eventId?: string | string[];
    id?: string | string[];
  }>();
  const globalParams = useGlobalSearchParams<{
    eventId?: string | string[];
    id?: string | string[];
  }>();
  const eventId = getParamValue(
    localParams.eventId ??
      globalParams.eventId ??
      localParams.id ??
      globalParams.id,
  );
  const isEdit = Boolean(eventId);
  const eventQuery = useEventDetailQuery(eventId, activeGroup?.id);
  const event = eventQuery.data;
  const isLoadingEvent = isEdit && (isLoadingGroups || eventQuery.isPending);
  let loadError: string | null = null;

  if (isEdit) {
    if (!isLoadingGroups && !activeGroup?.id) {
      loadError = 'Choose a space before editing this event.';
    } else if (eventQuery.error instanceof Error) {
      loadError = eventQuery.error.message;
    } else if (eventQuery.error) {
      loadError = 'Could not load event.';
    } else if (!isLoadingGroups && !eventQuery.isPending && !event) {
      loadError = 'Event not found.';
    }
  }

  if (isLoadingEvent) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ModalTopBar
            color={sectionColors.events}
            onClose={() => router.back()}
            title="Edit Event"
          />
          <Divider color={sectionColors.events} />
          <View style={styles.loadingState}>
            <ActivityIndicator color={sectionColors.events} />
            <Text style={styles.submittingText}>Loading event...</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ModalTopBar
            color={sectionColors.events}
            onClose={() => router.back()}
            title="Edit Event"
          />
          <Divider color={sectionColors.events} />
          <View style={styles.loadingState}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const initialValues = event ? getInitialValues(event) : EMPTY_VALUES;
  const initialPhotos = event ? getInitialPhotos(event.photos) : [];

  return (
    <EventForm
      key={`${eventId ?? 'new'}:${activeGroup?.id ?? 'no-group'}`}
      activeGroupId={activeGroup?.id ?? null}
      eventId={eventId}
      initialPhotos={initialPhotos}
      initialValues={initialValues}
      isEdit={isEdit}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  errorText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
    marginTop: -space.md,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    gap: space.sm,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  submittingText: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
});
