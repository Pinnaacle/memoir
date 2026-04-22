import { getSignedImageUrlMap } from '@/lib/images';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUserId,
  type JoinedPhoto,
  resolvePhotoStoragePath,
} from '@/services/userContext';

type MemoryWallRow = Record<string, unknown>;

export type MemoryWallType = 'moment' | 'event' | 'chapter';

export type MemoryWallItem = {
  id: string;
  sourceId: string;
  eventId?: string;
  momentId?: string;
  title: string;
  description: string;
  occurredOn: string;
  type: MemoryWallType;
  imageUrl?: string;
};

type EventPhotoLink = {
  event_id?: string | null;
  photos?: JoinedPhoto;
};

type MomentPhotoLink = {
  moment_id?: string | null;
  photos?: JoinedPhoto;
};

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => toNonEmptyString(item))
    .filter((item): item is string => Boolean(item));
}

function randomItem<T>(items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function normalizeType(value: string | null): MemoryWallType | null {
  const lowered = value?.toLowerCase() ?? '';

  if (!lowered) {
    return null;
  }

  if (lowered.includes('event')) {
    return 'event';
  }

  if (lowered.includes('moment')) {
    return 'moment';
  }

  if (lowered.includes('chapter')) {
    return 'chapter';
  }

  if (lowered.includes('milestone')) {
    return 'chapter';
  }

  return null;
}

function pickTypeHint(row: MemoryWallRow): MemoryWallType | null {
  if (toNonEmptyString(row.event_id)) {
    return 'event';
  }

  if (toNonEmptyString(row.moment_id)) {
    return 'moment';
  }

  if (toNonEmptyString(row.chapter_id)) {
    return 'chapter';
  }

  const candidate =
    toNonEmptyString(row.source_table) ??
    toNonEmptyString(row.table_name) ??
    toNonEmptyString(row.entity_table) ??
    toNonEmptyString(row.source_item_type) ??
    toNonEmptyString(row.entity_type) ??
    toNonEmptyString(row.source_type) ??
    toNonEmptyString(row.item_type) ??
    toNonEmptyString(row.item_kind) ??
    toNonEmptyString(row.kind) ??
    toNonEmptyString(row.type);

  return normalizeType(candidate);
}

function normalizeDate(value: unknown): string {
  const raw = toNonEmptyString(value) ?? '';

  if (!raw) {
    return '';
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toISOString();
}

function pickRowImageCandidates(row: MemoryWallRow): string[] {
  const inline = [
    toNonEmptyString(row.image_url),
    toNonEmptyString(row.cover_image_url),
    toNonEmptyString(row.photo_url),
    toNonEmptyString(row.storage_path),
    toNonEmptyString(row.image),
    toNonEmptyString(row.cover_image),
  ].filter((item): item is string => Boolean(item));

  const arrays = [
    ...toStringArray(row.image_urls),
    ...toStringArray(row.photo_urls),
    ...toStringArray(row.storage_paths),
    ...toStringArray(row.images),
    ...toStringArray(row.photos),
  ];

  return [...inline, ...arrays];
}

function normalizeStoragePath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return null;
  }

  const withoutLeadingSlash = trimmed.startsWith('/')
    ? trimmed.slice(1)
    : trimmed;
  return withoutLeadingSlash;
}

function pickSourceId(
  row: MemoryWallRow,
  typeHint: MemoryWallType | null,
): string {
  const eventId = toNonEmptyString(row.event_id);
  const momentId = toNonEmptyString(row.moment_id);
  const chapterId = toNonEmptyString(row.chapter_id);

  if (typeHint === 'event' && eventId) {
    return eventId;
  }

  if (typeHint === 'moment' && momentId) {
    return momentId;
  }

  if (typeHint === 'chapter' && chapterId) {
    return chapterId;
  }

  return (
    eventId ??
    momentId ??
    chapterId ??
    toNonEmptyString(row.source_item_id) ??
    toNonEmptyString(row.entity_id) ??
    toNonEmptyString(row.source_id) ??
    toNonEmptyString(row.item_id) ??
    toNonEmptyString(row.id) ??
    ''
  );
}

export async function listMemoryWallForGroup(
  groupId: string,
): Promise<MemoryWallItem[]> {
  const userId = await getCurrentUserId();

  if (!userId || !groupId) {
    return [];
  }

  const { data, error } = await supabase.from('memory_wall').select('*');

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as MemoryWallRow[]).filter((row) => {
    const rowGroupId = toNonEmptyString(row.group_id);
    return !rowGroupId || rowGroupId === groupId;
  });

  if (rows.length === 0) {
    return [];
  }

  const baseItems = rows
    .map((row) => {
      const typeHint = pickTypeHint(row);
      const sourceId = pickSourceId(row, typeHint);
      const eventId = toNonEmptyString(row.event_id) ?? undefined;
      const momentId = toNonEmptyString(row.moment_id) ?? undefined;
      const title =
        toNonEmptyString(row.title) ??
        toNonEmptyString(row.name) ??
        'Untitled memory';
      const description =
        toNonEmptyString(row.description) ??
        toNonEmptyString(row.notes) ??
        toNonEmptyString(row.summary) ??
        '';

      return {
        id: toNonEmptyString(row.id) ?? sourceId,
        sourceId,
        eventId,
        momentId,
        title,
        description,
        occurredOn: normalizeDate(
          row.occurred_on ?? row.occurred_at ?? row.date ?? row.created_at,
        ),
        typeHint,
        imageCandidates: pickRowImageCandidates(row),
      };
    })
    .filter((item) => Boolean(item.id));

  const candidateSourceIds = Array.from(
    new Set(baseItems.map((item) => item.sourceId).filter(Boolean)),
  );

  const [eventLinksResult, momentLinksResult] = await Promise.all([
    candidateSourceIds.length > 0
      ? supabase
          .from('event_photos')
          .select('event_id, photos(storage_path)')
          .in('event_id', candidateSourceIds)
      : Promise.resolve({ data: [], error: null }),
    candidateSourceIds.length > 0
      ? supabase
          .from('moment_photos')
          .select('moment_id, photos(storage_path)')
          .in('moment_id', candidateSourceIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (eventLinksResult.error) {
    throw new Error(eventLinksResult.error.message);
  }

  if (momentLinksResult.error) {
    throw new Error(momentLinksResult.error.message);
  }

  const randomPathBySourceId = new Map<string, string>();

  const eventPathsById = new Map<string, string[]>();
  for (const link of (eventLinksResult.data ?? []) as EventPhotoLink[]) {
    if (!link.event_id) {
      continue;
    }

    const storagePath = resolvePhotoStoragePath(link.photos);
    if (!storagePath) {
      continue;
    }

    const paths = eventPathsById.get(link.event_id) ?? [];
    paths.push(storagePath);
    eventPathsById.set(link.event_id, paths);
  }

  const momentPathsById = new Map<string, string[]>();
  for (const link of (momentLinksResult.data ?? []) as MomentPhotoLink[]) {
    if (!link.moment_id) {
      continue;
    }

    const storagePath = resolvePhotoStoragePath(link.photos);
    if (!storagePath) {
      continue;
    }

    const paths = momentPathsById.get(link.moment_id) ?? [];
    paths.push(storagePath);
    momentPathsById.set(link.moment_id, paths);
  }

  for (const [sourceId, paths] of eventPathsById) {
    const picked = randomItem(paths);
    if (picked) {
      randomPathBySourceId.set(sourceId, picked);
    }
  }

  for (const [sourceId, paths] of momentPathsById) {
    const picked = randomItem(paths);
    if (picked) {
      randomPathBySourceId.set(sourceId, picked);
    }
  }

  const allPathsToSign = new Set<string>();
  for (const item of baseItems) {
    const linkedPath = randomPathBySourceId.get(item.sourceId);
    const rowPath = randomItem(
      item.imageCandidates.filter(
        (value) =>
          !value.startsWith('http://') && !value.startsWith('https://'),
      ),
    );

    if (linkedPath) {
      allPathsToSign.add(linkedPath);
    }

    if (rowPath) {
      allPathsToSign.add(rowPath);
    }
  }

  const signedUrls = await getSignedImageUrlMap(Array.from(allPathsToSign));

  const storagePaths = Array.from(
    new Set(
      baseItems
        .map((item) => randomItem(item.imageCandidates) ?? '')
        .filter(Boolean),
    ),
  );

  const [eventPhotosLookupResult, momentPhotosLookupResult] = await Promise.all(
    [
      storagePaths.length > 0
        ? supabase
            .from('event_photos')
            .select('event_id, photos(storage_path)')
            .limit(1000)
        : Promise.resolve({ data: [], error: null }),
      storagePaths.length > 0
        ? supabase
            .from('moment_photos')
            .select('moment_id, photos(storage_path)')
            .limit(1000)
        : Promise.resolve({ data: [], error: null }),
    ],
  );

  if (eventPhotosLookupResult.error) {
    throw new Error(eventPhotosLookupResult.error.message);
  }

  if (momentPhotosLookupResult.error) {
    throw new Error(momentPhotosLookupResult.error.message);
  }

  const storagePathToEventId = new Map<string, string>();
  const storagePathToMomentId = new Map<string, string>();

  for (const link of (eventPhotosLookupResult.data ?? []) as EventPhotoLink[]) {
    if (!link.event_id) continue;
    const storagePath = resolvePhotoStoragePath(link.photos);
    if (storagePath) {
      const normalizedPath = normalizeStoragePath(storagePath);
      if (normalizedPath) {
        storagePathToEventId.set(normalizedPath, link.event_id);
      }
    }
  }

  for (const link of (momentPhotosLookupResult.data ??
    []) as MomentPhotoLink[]) {
    if (!link.moment_id) continue;
    const storagePath = resolvePhotoStoragePath(link.photos);
    if (storagePath) {
      const normalizedPath = normalizeStoragePath(storagePath);
      if (normalizedPath) {
        storagePathToMomentId.set(normalizedPath, link.moment_id);
      }
    }
  }

  const itemsWithResolvedIds = baseItems.map((item) => {
    const linkedPath = randomPathBySourceId.get(item.sourceId);
    const rowStoragePath = randomItem(
      item.imageCandidates.filter(
        (value) =>
          !value.startsWith('http://') && !value.startsWith('https://'),
      ),
    );

    let resolvedEventId: string | undefined = item.eventId;
    let resolvedMomentId: string | undefined = item.momentId;

    if (!resolvedEventId && !resolvedMomentId && rowStoragePath) {
      const normalizedPath = normalizeStoragePath(rowStoragePath);
      if (normalizedPath) {
        resolvedEventId = storagePathToEventId.get(normalizedPath);
        resolvedMomentId = storagePathToMomentId.get(normalizedPath);
      }
    }

    return {
      ...item,
      linkedPath,
      rowStoragePath,
      resolvedEventId,
      resolvedMomentId,
    };
  });

  const eventIdsToFetch = Array.from(
    new Set(
      itemsWithResolvedIds
        .filter((item) => item.resolvedEventId)
        .map((item) => item.resolvedEventId) as string[],
    ),
  );

  const momentIdsToFetch = Array.from(
    new Set(
      itemsWithResolvedIds
        .filter((item) => item.resolvedMomentId)
        .map((item) => item.resolvedMomentId) as string[],
    ),
  );

  const [eventsDataResult, momentsDataResult] = await Promise.all([
    eventIdsToFetch.length > 0
      ? supabase
          .from('events')
          .select('id, title, notes, occurred_on')
          .in('id', eventIdsToFetch)
      : Promise.resolve({ data: [], error: null }),
    momentIdsToFetch.length > 0
      ? supabase
          .from('moments')
          .select('id, title, description, occurred_on')
          .in('id', momentIdsToFetch)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (eventsDataResult.error) {
    throw new Error(eventsDataResult.error.message);
  }

  if (momentsDataResult.error) {
    throw new Error(momentsDataResult.error.message);
  }

  const eventsById = new Map(
    (eventsDataResult.data ?? []).map((row: any) => [row.id, row]),
  );
  const momentsById = new Map(
    (momentsDataResult.data ?? []).map((row: any) => [row.id, row]),
  );

  return itemsWithResolvedIds
    .map((item) => {
      const directUrl = randomItem(
        item.imageCandidates.filter(
          (value) =>
            value.startsWith('http://') || value.startsWith('https://'),
        ),
      );

      const imageUrl =
        directUrl ??
        (item.linkedPath ? signedUrls.get(item.linkedPath) : undefined) ??
        (item.rowStoragePath ? signedUrls.get(item.rowStoragePath) : undefined);

      let title = item.title;
      let description = item.description;
      let occurredOn = item.occurredOn;

      if (item.resolvedEventId) {
        const event = eventsById.get(item.resolvedEventId);
        if (event) {
          title = event.title;
          description = event.notes || '';
          occurredOn = event.occurred_on;
        }
      } else if (item.resolvedMomentId) {
        const moment = momentsById.get(item.resolvedMomentId);
        if (moment) {
          title = moment.title;
          description = moment.description || '';
          occurredOn = moment.occurred_on;
        }
      }

      const type: MemoryWallType =
        item.typeHint ??
        (eventPathsById.has(item.sourceId)
          ? 'event'
          : momentPathsById.has(item.sourceId)
            ? 'moment'
            : item.resolvedEventId
              ? 'event'
              : item.resolvedMomentId
                ? 'moment'
                : 'moment');

      return {
        id: item.id,
        sourceId: item.sourceId,
        eventId: item.resolvedEventId,
        momentId: item.resolvedMomentId,
        title,
        description,
        occurredOn,
        type,
        imageUrl,
      } satisfies MemoryWallItem;
    })
    .sort((left, right) => right.occurredOn.localeCompare(left.occurredOn));
}
