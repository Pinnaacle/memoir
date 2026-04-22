import MomentForm from '@/components/MomentForm';
import ModalTopBar from '@/components/ModalTopBar';
import { type SelectedImage } from '@/components/ui/AddImageField';
import Divider from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { useActiveGroup } from '@/hooks/useActiveGroup';
import { useMomentDetailQuery } from '@/hooks/useMoments';
import { type CreateMomentValues } from '@/lib/validation/moment';
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

const EMPTY_VALUES: CreateMomentValues = {
  momentType: '',
  title: '',
  description: '',
  occurredAt: new Date(),
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

function getInitialValues(moment: {
  title: string;
  description: string | null;
  category: string | null;
  occurredOn: string;
}): CreateMomentValues {
  return {
    momentType: moment.category ?? '',
    title: moment.title,
    description: moment.description ?? '',
    occurredAt: parseOccurredAt(moment.occurredOn),
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

function getLoadError(options: {
  activeGroupId: string | null | undefined;
  error: unknown;
  hasMoment: boolean;
  isEdit: boolean;
  isLoadingGroups: boolean;
  isMomentPending: boolean;
}): string | null {
  const {
    activeGroupId,
    error,
    hasMoment,
    isEdit,
    isLoadingGroups,
    isMomentPending,
  } = options;

  if (!isEdit) {
    return null;
  }

  if (!isLoadingGroups && !activeGroupId) {
    return 'Choose a space before editing this moment.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error) {
    return 'Could not load moment.';
  }

  if (!isLoadingGroups && !isMomentPending && !hasMoment) {
    return 'Moment not found.';
  }

  return null;
}

export default function NewMomentScreen() {
  const { activeGroup, isLoading: isLoadingGroups } = useActiveGroup();
  const localParams = useLocalSearchParams<{
    momentId?: string | string[];
    id?: string | string[];
  }>();
  const globalParams = useGlobalSearchParams<{
    momentId?: string | string[];
    id?: string | string[];
  }>();
  const momentId = getParamValue(
    localParams.momentId ??
      globalParams.momentId ??
      localParams.id ??
      globalParams.id,
  );
  const isEdit = Boolean(momentId);
  const momentQuery = useMomentDetailQuery(momentId, activeGroup?.id);
  const moment = momentQuery.data;
  const isLoadingMoment = isEdit && (isLoadingGroups || momentQuery.isPending);
  const loadError = getLoadError({
    activeGroupId: activeGroup?.id,
    error: momentQuery.error,
    hasMoment: Boolean(moment),
    isEdit,
    isLoadingGroups,
    isMomentPending: momentQuery.isPending,
  });

  if (isLoadingMoment) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ModalTopBar
            color={sectionColors.moments}
            onClose={() => router.back()}
            title="Edit Moment"
          />
          <Divider color={sectionColors.moments} />
          <View style={styles.loadingState}>
            <ActivityIndicator color={sectionColors.moments} />
            <Text style={styles.submittingText}>Loading moment...</Text>
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
            color={sectionColors.moments}
            onClose={() => router.back()}
            title="Edit Moment"
          />
          <Divider color={sectionColors.moments} />
          <View style={styles.loadingState}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const initialValues = moment ? getInitialValues(moment) : EMPTY_VALUES;
  const initialPhotos = moment ? getInitialPhotos(moment.photos) : [];

  return (
    <MomentForm
      key={`${momentId ?? 'new'}:${activeGroup?.id ?? 'no-group'}`}
      activeGroupId={activeGroup?.id ?? null}
      initialPhotos={initialPhotos}
      initialValues={initialValues}
      isEdit={isEdit}
      momentId={momentId}
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
