import { getSignedImageUrlMap, IMAGE_BUCKET_ID } from '@/lib/images';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUserId,
  type JoinedPhoto,
  resolvePhotoStoragePath,
} from '@/services/userContext';

type TimelineItemRow = Record<string, unknown>;

type EventPhotoLink = {
  event_id?: string | null;
  photos?: JoinedPhoto;
};

type MomentPhotoLink = {
  moment_id?: string | null;
  photos?: JoinedPhoto;
};

export type TimelineItem = {
  id: string;
  title: string;
  description: string;
  occurredOn: string;
  displayType: string;
  coverImage?: string;
  kind?: 'event' | 'moment' | null;
  sourceId?: string;
};

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toIsoDate(value: unknown): string {
  const asString =
    toNonEmptyString(value) ??
    toNonEmptyString((value as { toString?: () => string })?.toString?.()) ??
    '';

  if (!asString) {
    return '';
  }

  const date = new Date(asString);
  return Number.isNaN(date.getTime()) ? asString : date.toISOString();
}

function normalizeKind(value: string | null): 'event' | 'moment' | null {
  if (!value) {
    return null;
  }

  const lowered = value.toLowerCase();

  if (lowered.includes('event')) {
    return 'event';
  }

  if (lowered.includes('moment')) {
    return 'moment';
  }

  return null;
}

function normalizeTypeLabel(value: string | null): string {
  if (!value) {
    return 'Memory';
  }

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getImagePathOrUrl(row: TimelineItemRow): string | null {
  return (
    toNonEmptyString(row.cover_image_url) ??
    toNonEmptyString(row.cover_image_path) ??
    toNonEmptyString(row.cover_image) ??
    toNonEmptyString(row.photo_storage_path) ??
    toNonEmptyString(row.primary_photo_storage_path) ??
    toNonEmptyString(row.image_url) ??
    toNonEmptyString(row.image) ??
    toNonEmptyString(row.photo_url) ??
    toNonEmptyString(row.storage_path)
  );
}

function normalizeStoragePath(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname;
      const prefixes = [
        `/storage/v1/object/public/${IMAGE_BUCKET_ID}/`,
        `/storage/v1/object/sign/${IMAGE_BUCKET_ID}/`,
        `/storage/v1/object/authenticated/${IMAGE_BUCKET_ID}/`,
      ];

      for (const prefix of prefixes) {
        if (path.startsWith(prefix)) {
          return decodeURIComponent(path.slice(prefix.length));
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  const withoutLeadingSlash = trimmed.startsWith('/')
    ? trimmed.slice(1)
    : trimmed;

  if (withoutLeadingSlash.startsWith(`${IMAGE_BUCKET_ID}/`)) {
    return withoutLeadingSlash.slice(IMAGE_BUCKET_ID.length + 1);
  }

  return withoutLeadingSlash;
}

function pickSourceId(row: TimelineItemRow): string {
  return (
    toNonEmptyString(row.source_item_id) ??
    toNonEmptyString(row.entity_id) ??
    toNonEmptyString(row.source_id) ??
    toNonEmptyString(row.item_id) ??
    toNonEmptyString(row.event_id) ??
    toNonEmptyString(row.moment_id) ??
    toNonEmptyString(row.id) ??
    ''
  );
}

function pickKind(row: TimelineItemRow): 'event' | 'moment' | null {
  if (toNonEmptyString(row.event_id)) {
    return 'event';
  }

  if (toNonEmptyString(row.moment_id)) {
    return 'moment';
  }

  return normalizeKind(
    toNonEmptyString(row.source_table) ??
      toNonEmptyString(row.table_name) ??
      toNonEmptyString(row.entity_table) ??
      toNonEmptyString(row.source_item_type) ??
      toNonEmptyString(row.entity_type) ??
      toNonEmptyString(row.item_kind) ??
      toNonEmptyString(row.item_type) ??
      toNonEmptyString(row.source_type) ??
      toNonEmptyString(row.kind) ??
      toNonEmptyString(row.type),
  );
}

function shouldUseKindAsDisplayType(
  displayType: string,
  kind: 'event' | 'moment' | null,
): boolean {
  if (!kind) {
    return false;
  }

  const lowered = displayType.toLowerCase();
  return lowered === 'memory' || lowered === 'memories';
}

function resolveCoverImage(
  imagePathOrUrl: string | null,
  signedMap: Map<string, string>,
): string | undefined {
  if (!imagePathOrUrl) {
    return undefined;
  }

  const normalizedPath = normalizeStoragePath(imagePathOrUrl);

  if (!normalizedPath) {
    return imagePathOrUrl.startsWith('http://') ||
      imagePathOrUrl.startsWith('https://')
      ? imagePathOrUrl
      : undefined;
  }

  return signedMap.get(normalizedPath);
}

export async function listTimelineItemsForGroup(
  groupId: string,
): Promise<TimelineItem[]> {
  const userId = await getCurrentUserId();

  if (!userId || !groupId) {
    return [];
  }

  const { data, error } = await supabase.from('timeline_items').select('*');

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as TimelineItemRow[]).filter((row) => {
    const rowGroupId = toNonEmptyString(row.group_id);
    return !rowGroupId || rowGroupId === groupId;
  });

  if (rows.length === 0) {
    return [];
  }

  const imagePaths = rows
    .map((row) => getImagePathOrUrl(row))
    .filter((value): value is string => Boolean(value))
    .filter(
      (value) => !value.startsWith('http://') && !value.startsWith('https://'),
    );

  const signedMap = await getSignedImageUrlMap(Array.from(new Set(imagePaths)));

  const mappedItems = rows
    .map((row) => {
      const title =
        toNonEmptyString(row.title) ??
        toNonEmptyString(row.name) ??
        toNonEmptyString(row.headline) ??
        'Untitled memory';
      const description =
        toNonEmptyString(row.description) ??
        toNonEmptyString(row.body) ??
        toNonEmptyString(row.content) ??
        toNonEmptyString(row.details) ??
        toNonEmptyString(row.text) ??
        toNonEmptyString(row.caption) ??
        toNonEmptyString(row.note) ??
        toNonEmptyString(row.notes) ??
        toNonEmptyString(row.message) ??
        toNonEmptyString(row.subtitle) ??
        toNonEmptyString(row.summary) ??
        '';
      const kind = pickKind(row);
      const displayType = normalizeTypeLabel(
        toNonEmptyString(row.display_type) ??
          toNonEmptyString(row.type_label) ??
          toNonEmptyString(row.item_label) ??
          toNonEmptyString(row.source_item_type) ??
          toNonEmptyString(row.entity_type) ??
          toNonEmptyString(row.item_kind) ??
          toNonEmptyString(row.item_type) ??
          toNonEmptyString(row.source_type) ??
          toNonEmptyString(row.kind) ??
          toNonEmptyString(row.category) ??
          toNonEmptyString(row.mood) ??
          toNonEmptyString(row.type) ??
          (kind === 'event' ? 'Event' : kind === 'moment' ? 'Moment' : null),
      );
      const imagePathOrUrl = getImagePathOrUrl(row);
      const sourceId = pickSourceId(row);

      return {
        id: toNonEmptyString(row.id) ?? sourceId,
        title,
        description,
        occurredOn: toIsoDate(
          row.occurred_on ?? row.occurred_at ?? row.date ?? row.created_at,
        ),
        displayType,
        coverImage: resolveCoverImage(imagePathOrUrl, signedMap),
        kind,
        sourceId,
      } satisfies TimelineItem;
    })
    .filter((item) => Boolean(item.id));

  const candidateSourceIds = Array.from(
    new Set(
      mappedItems
        .map((item) => item.sourceId)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [eventsResult, momentsResult] = await Promise.all([
    candidateSourceIds.length > 0
      ? supabase
          .from('events')
          .select('id, title, notes, mood, occurred_on')
          .in('id', candidateSourceIds)
          .eq('group_id', groupId)
      : Promise.resolve({ data: [], error: null }),
    candidateSourceIds.length > 0
      ? supabase
          .from('moments')
          .select('id, title, description, category, occurred_on')
          .in('id', candidateSourceIds)
          .eq('group_id', groupId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (eventsResult.error) {
    throw new Error(eventsResult.error.message);
  }

  if (momentsResult.error) {
    throw new Error(momentsResult.error.message);
  }

  const [eventPhotoLinksResult, momentPhotoLinksResult] = await Promise.all([
    candidateSourceIds.length > 0
      ? supabase
          .from('event_photos')
          .select('event_id, sort_order, photos(storage_path)')
          .in('event_id', candidateSourceIds)
          .eq('group_id', groupId)
          .order('event_id', { ascending: true })
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    candidateSourceIds.length > 0
      ? supabase
          .from('moment_photos')
          .select('moment_id, sort_order, photos(storage_path)')
          .in('moment_id', candidateSourceIds)
          .eq('group_id', groupId)
          .order('moment_id', { ascending: true })
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (eventPhotoLinksResult.error) {
    throw new Error(eventPhotoLinksResult.error.message);
  }

  if (momentPhotoLinksResult.error) {
    throw new Error(momentPhotoLinksResult.error.message);
  }

  const coverPathBySourceId = new Map<string, string>();

  for (const link of (eventPhotoLinksResult.data ?? []) as EventPhotoLink[]) {
    const storagePath = resolvePhotoStoragePath(link.photos);

    if (!link.event_id || !storagePath) {
      continue;
    }

    if (!coverPathBySourceId.has(link.event_id)) {
      coverPathBySourceId.set(link.event_id, storagePath);
    }
  }

  for (const link of (momentPhotoLinksResult.data ?? []) as MomentPhotoLink[]) {
    const storagePath = resolvePhotoStoragePath(link.photos);

    if (!link.moment_id || !storagePath) {
      continue;
    }

    if (!coverPathBySourceId.has(link.moment_id)) {
      coverPathBySourceId.set(link.moment_id, storagePath);
    }
  }

  const signedCoverUrlsByPath = await getSignedImageUrlMap(
    Array.from(new Set(Array.from(coverPathBySourceId.values()))),
  );

  const signedCoverUrlsBySourceId = new Map<string, string>();

  for (const [sourceId, storagePath] of coverPathBySourceId.entries()) {
    const signedUrl = signedCoverUrlsByPath.get(storagePath);

    if (signedUrl) {
      signedCoverUrlsBySourceId.set(sourceId, signedUrl);
    }
  }

  const eventsById = new Map(
    (eventsResult.data ?? []).map((event) => [event.id, event]),
  );
  const momentsById = new Map(
    (momentsResult.data ?? []).map((moment) => [moment.id, moment]),
  );

  return mappedItems
    .map((item) => {
      const sourceId = item.sourceId;
      const matchedEvent = sourceId ? eventsById.get(sourceId) : undefined;
      const matchedMoment = sourceId ? momentsById.get(sourceId) : undefined;

      if (matchedEvent) {
        const displayType = shouldUseKindAsDisplayType(
          item.displayType,
          'event',
        )
          ? 'Event'
          : item.displayType;

        return {
          ...item,
          kind: 'event' as const,
          title: item.title || matchedEvent.title || 'Untitled event',
          description: item.description || matchedEvent.notes || '',
          occurredOn: item.occurredOn || matchedEvent.occurred_on,
          displayType,
          coverImage:
            item.coverImage ??
            (sourceId ? signedCoverUrlsBySourceId.get(sourceId) : undefined),
        } satisfies TimelineItem;
      }

      if (matchedMoment) {
        const displayType = shouldUseKindAsDisplayType(
          item.displayType,
          'moment',
        )
          ? 'Moment'
          : item.displayType;

        return {
          ...item,
          kind: 'moment' as const,
          title: item.title || matchedMoment.title || 'Untitled moment',
          description: item.description || matchedMoment.description || '',
          occurredOn: item.occurredOn || matchedMoment.occurred_on,
          displayType,
          coverImage:
            item.coverImage ??
            (sourceId ? signedCoverUrlsBySourceId.get(sourceId) : undefined),
        } satisfies TimelineItem;
      }

      return item;
    })
    .sort((left, right) => right.occurredOn.localeCompare(left.occurredOn));
}
