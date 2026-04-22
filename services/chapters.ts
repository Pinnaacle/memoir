import { toLocalDateString } from '@/lib/date';
import { getSignedImageUrlMap } from '@/lib/images';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUserId,
  type JoinedPhoto,
  requireCurrentUserId,
  resolvePhotoStoragePath,
} from '@/services/userContext';

export type ChapterItemKind = 'moment' | 'event';

export type ChapterItemInput = {
  kind: ChapterItemKind;
  id: string;
};

export type CreateChapterInput = {
  groupId: string;
  chapterType: string;
  title: string;
  description: string;
  occurredAt: Date;
  items: ChapterItemInput[];
};

export type UpdateChapterInput = CreateChapterInput & {
  chapterId: string;
};

export type ChapterListItem = {
  id: string;
  title: string;
  description: string | null;
  chapterType: string | null;
  occurredOn: string;
  images: string[];
};

export type ChapterDetailEntry = {
  kind: ChapterItemKind;
  id: string;
  title: string;
  occurredOn: string;
  coverImage?: string;
};

export type ChapterDetail = {
  id: string;
  title: string;
  description: string | null;
  chapterType: string | null;
  occurredOn: string;
  entries: ChapterDetailEntry[];
};

type ChapterItemRow = {
  chapter_id?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  sort_order?: number | null;
};

type PhotoLinkRow = {
  moment_id?: string | null;
  event_id?: string | null;
  sort_order?: number | null;
  photos?: JoinedPhoto;
};

type MomentRow = {
  id: string;
  title: string;
  occurred_on: string;
};

type EventRow = {
  id: string;
  title: string;
  occurred_on: string;
};

const PREVIEW_IMAGE_LIMIT = 4;

function makeRefKey(kind: ChapterItemKind, refId: string) {
  return `${kind}:${refId}`;
}

async function fetchRefPhotoPaths(
  groupId: string,
  momentIds: string[],
  eventIds: string[],
): Promise<Map<string, string[]>> {
  const photosByRef = new Map<string, string[]>();

  if (momentIds.length > 0) {
    const { data, error } = await supabase
      .from('moment_photos')
      .select('moment_id, sort_order, photos(storage_path)')
      .eq('group_id', groupId)
      .in('moment_id', momentIds)
      .order('moment_id', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    for (const link of (data ?? []) as PhotoLinkRow[]) {
      const storagePath = resolvePhotoStoragePath(link.photos);
      if (!link.moment_id || !storagePath) continue;

      const key = makeRefKey('moment', link.moment_id);
      const existing = photosByRef.get(key) ?? [];
      existing.push(storagePath);
      photosByRef.set(key, existing);
    }
  }

  if (eventIds.length > 0) {
    const { data, error } = await supabase
      .from('event_photos')
      .select('event_id, sort_order, photos(storage_path)')
      .eq('group_id', groupId)
      .in('event_id', eventIds)
      .order('event_id', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    for (const link of (data ?? []) as PhotoLinkRow[]) {
      const storagePath = resolvePhotoStoragePath(link.photos);
      if (!link.event_id || !storagePath) continue;

      const key = makeRefKey('event', link.event_id);
      const existing = photosByRef.get(key) ?? [];
      existing.push(storagePath);
      photosByRef.set(key, existing);
    }
  }

  return photosByRef;
}

export async function listChaptersForGroup(
  groupId: string,
): Promise<ChapterListItem[]> {
  const userId = await getCurrentUserId();

  if (!userId || !groupId) {
    return [];
  }

  const { data: chapters, error } = await supabase
    .from('chapters')
    .select('id, title, description, chapter_type, occurred_on, created_at')
    .eq('group_id', groupId)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = chapters ?? [];

  if (rows.length === 0) {
    return [];
  }

  const chapterIds = rows.map((chapter) => chapter.id);
  const { data: itemRows, error: itemsError } = await supabase
    .from('chapter_items')
    .select('chapter_id, ref_type, ref_id, sort_order')
    .eq('group_id', groupId)
    .in('chapter_id', chapterIds)
    .order('chapter_id', { ascending: true })
    .order('sort_order', { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const itemsByChapter = new Map<string, ChapterItemRow[]>();
  for (const item of (itemRows ?? []) as ChapterItemRow[]) {
    if (!item.chapter_id) continue;

    const existing = itemsByChapter.get(item.chapter_id) ?? [];
    existing.push(item);
    itemsByChapter.set(item.chapter_id, existing);
  }

  const momentIdSet = new Set<string>();
  const eventIdSet = new Set<string>();

  for (const items of itemsByChapter.values()) {
    for (const item of items) {
      if (!item.ref_id) continue;

      if (item.ref_type === 'moment') {
        momentIdSet.add(item.ref_id);
      } else if (item.ref_type === 'event') {
        eventIdSet.add(item.ref_id);
      }
    }
  }

  const photosByRef = await fetchRefPhotoPaths(
    groupId,
    Array.from(momentIdSet),
    Array.from(eventIdSet),
  );

  const previewPathsByChapter = new Map<string, string[]>();
  const pathsToSign = new Set<string>();

  for (const chapter of rows) {
    const items = itemsByChapter.get(chapter.id) ?? [];
    const chapterPaths: string[] = [];
    const seenPaths = new Set<string>();

    for (const item of items) {
      if (chapterPaths.length >= PREVIEW_IMAGE_LIMIT) break;
      if (!item.ref_id || !item.ref_type) continue;
      if (item.ref_type !== 'moment' && item.ref_type !== 'event') continue;

      const paths = photosByRef.get(makeRefKey(item.ref_type, item.ref_id));
      if (!paths) continue;

      for (const path of paths) {
        if (chapterPaths.length >= PREVIEW_IMAGE_LIMIT) break;
        if (seenPaths.has(path)) continue;

        seenPaths.add(path);
        chapterPaths.push(path);
        pathsToSign.add(path);
      }
    }

    previewPathsByChapter.set(chapter.id, chapterPaths);
  }

  const signedUrls = await getSignedImageUrlMap(Array.from(pathsToSign));

  return rows.map((chapter) => {
    const paths = previewPathsByChapter.get(chapter.id) ?? [];
    const images: string[] = [];

    for (const path of paths) {
      const url = signedUrls.get(path);
      if (url) images.push(url);
    }

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      chapterType: chapter.chapter_type,
      occurredOn: chapter.occurred_on,
      images,
    };
  });
}

export async function getChapterById(
  chapterId: string,
  groupId: string,
): Promise<ChapterDetail | null> {
  const userId = await getCurrentUserId();

  if (!userId || !chapterId || !groupId) {
    return null;
  }

  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('id, title, description, chapter_type, occurred_on')
    .eq('id', chapterId)
    .eq('group_id', groupId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!chapter) {
    return null;
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from('chapter_items')
    .select('chapter_id, ref_type, ref_id, sort_order')
    .eq('group_id', groupId)
    .eq('chapter_id', chapterId)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const items = (itemRows ?? []) as ChapterItemRow[];
  const momentIds: string[] = [];
  const eventIds: string[] = [];

  for (const item of items) {
    if (!item.ref_id) continue;
    if (item.ref_type === 'moment') momentIds.push(item.ref_id);
    else if (item.ref_type === 'event') eventIds.push(item.ref_id);
  }

  const [moments, events] = await Promise.all([
    momentIds.length > 0
      ? supabase
          .from('moments')
          .select('id, title, occurred_on')
          .eq('group_id', groupId)
          .in('id', momentIds)
      : Promise.resolve({ data: [] as MomentRow[], error: null }),
    eventIds.length > 0
      ? supabase
          .from('events')
          .select('id, title, occurred_on')
          .eq('group_id', groupId)
          .in('id', eventIds)
      : Promise.resolve({ data: [] as EventRow[], error: null }),
  ]);

  if (moments.error) throw new Error(moments.error.message);
  if (events.error) throw new Error(events.error.message);

  const momentById = new Map<string, MomentRow>();
  for (const row of (moments.data ?? []) as MomentRow[]) {
    momentById.set(row.id, row);
  }
  const eventById = new Map<string, EventRow>();
  for (const row of (events.data ?? []) as EventRow[]) {
    eventById.set(row.id, row);
  }

  const photosByRef = await fetchRefPhotoPaths(groupId, momentIds, eventIds);
  const allPaths = new Set<string>();
  for (const paths of photosByRef.values()) {
    const firstPath = paths[0];
    if (firstPath) {
      allPaths.add(firstPath);
    }
  }
  const signedUrls = await getSignedImageUrlMap(Array.from(allPaths));

  const entries: ChapterDetailEntry[] = [];

  for (const item of items) {
    if (!item.ref_id || !item.ref_type) continue;
    if (item.ref_type !== 'moment' && item.ref_type !== 'event') continue;

    const source =
      item.ref_type === 'moment'
        ? momentById.get(item.ref_id)
        : eventById.get(item.ref_id);

    if (!source) continue;

    const storagePath = photosByRef.get(
      makeRefKey(item.ref_type, item.ref_id),
    )?.[0];
    const coverImage = storagePath ? signedUrls.get(storagePath) : undefined;

    entries.push({
      kind: item.ref_type,
      id: source.id,
      title: source.title,
      occurredOn: source.occurred_on,
      coverImage,
    });
  }

  return {
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    chapterType: chapter.chapter_type,
    occurredOn: chapter.occurred_on,
    entries,
  };
}

export async function createChapter(
  input: CreateChapterInput,
): Promise<string> {
  const userId = await requireCurrentUserId(
    'You must be signed in to create a chapter.',
  );

  if (!input.groupId) {
    throw new Error('A group must be selected before creating a chapter.');
  }

  const description = input.description.trim();

  const { data: insertedChapter, error: chapterError } = await supabase
    .from('chapters')
    .insert({
      group_id: input.groupId,
      created_by: userId,
      title: input.title.trim(),
      chapter_type: input.chapterType.trim() || null,
      description: description.length > 0 ? description : null,
      occurred_on: toLocalDateString(input.occurredAt),
    })
    .select('id')
    .single();

  if (chapterError) {
    throw new Error(chapterError.message);
  }

  if (!insertedChapter?.id) {
    throw new Error('Could not create chapter.');
  }

  if (input.items.length === 0) {
    return insertedChapter.id;
  }

  const seen = new Set<string>();
  const dedupedItems = input.items.filter((item) => {
    const key = makeRefKey(item.kind, item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const { error: itemsError } = await supabase.from('chapter_items').insert(
    dedupedItems.map((item, index) => ({
      group_id: input.groupId,
      chapter_id: insertedChapter.id,
      ref_type: item.kind,
      ref_id: item.id,
      sort_order: index,
    })),
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return insertedChapter.id;
}

export async function updateChapter(
  input: UpdateChapterInput,
): Promise<string> {
  await requireCurrentUserId('You must be signed in to edit a chapter.');

  if (!input.groupId) {
    throw new Error('A group must be selected before editing a chapter.');
  }

  if (!input.chapterId) {
    throw new Error('Chapter not found.');
  }

  const description = input.description.trim();

  const { data: updatedChapter, error: chapterError } = await supabase
    .from('chapters')
    .update({
      title: input.title.trim(),
      chapter_type: input.chapterType.trim() || null,
      description: description.length > 0 ? description : null,
      occurred_on: toLocalDateString(input.occurredAt),
    })
    .eq('id', input.chapterId)
    .eq('group_id', input.groupId)
    .select('id')
    .single();

  if (chapterError) {
    throw new Error(chapterError.message);
  }

  if (!updatedChapter?.id) {
    throw new Error('Could not update chapter.');
  }

  const { error: deleteItemsError } = await supabase
    .from('chapter_items')
    .delete()
    .eq('group_id', input.groupId)
    .eq('chapter_id', input.chapterId);

  if (deleteItemsError) {
    throw new Error(deleteItemsError.message);
  }

  if (input.items.length === 0) {
    return updatedChapter.id;
  }

  const seen = new Set<string>();
  const dedupedItems = input.items.filter((item) => {
    const key = makeRefKey(item.kind, item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const { error: itemsError } = await supabase.from('chapter_items').insert(
    dedupedItems.map((item, index) => ({
      group_id: input.groupId,
      chapter_id: input.chapterId,
      ref_type: item.kind,
      ref_id: item.id,
      sort_order: index,
    })),
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return updatedChapter.id;
}

export async function deleteChapter(chapterId: string, groupId: string) {
  await requireCurrentUserId('You must be signed in to delete a chapter.');

  if (!chapterId || !groupId) {
    throw new Error('Chapter not found.');
  }

  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId)
    .eq('group_id', groupId);

  if (error) {
    throw new Error(error.message);
  }
}
