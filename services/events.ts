import {
  getSignedImageUrlMap,
  IMAGE_BUCKET_ID,
  MAX_IMAGES_PER_UPLOAD,
} from '@/lib/images';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUserId,
  type JoinedPhoto,
  requireCurrentUserId,
  resolvePhotoStoragePath,
} from '@/services/userContext';

export type EventPhotoInput = {
  storagePath?: string | null;
};

export type CreateEventInput = {
  groupId: string;
  title: string;
  occurredAt: Date;
  location: string;
  mood: string;
  notes: string;
  photos: EventPhotoInput[];
};

export type UpdateEventInput = CreateEventInput & {
  eventId: string;
};

export type EventListItem = {
  id: string;
  title: string;
  occurredOn: string;
  locationText: string | null;
  mood: string | null;
  coverImage?: string;
};

export type EventDetailPhoto = {
  storagePath: string;
  url: string;
};

export type EventDetail = {
  id: string;
  title: string;
  occurredOn: string;
  locationText: string | null;
  mood: string | null;
  notes: string | null;
  photos: EventDetailPhoto[];
};

type EventPhotoLink = {
  event_id?: string | null;
  photo_id?: string | null;
  photos?: JoinedPhoto;
};

type InsertedPhotoRow = {
  id: string;
  storage_path: string;
};

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertPhotoLimit(photoCount: number) {
  if (photoCount > MAX_IMAGES_PER_UPLOAD) {
    throw new Error(
      `You can attach at most ${MAX_IMAGES_PER_UPLOAD} photos to an event.`,
    );
  }
}

function getEventValues(input: CreateEventInput) {
  return {
    title: input.title.trim(),
    occurred_on: input.occurredAt.toISOString().slice(0, 10),
    location_text: normalizeOptionalText(input.location),
    mood: normalizeOptionalText(input.mood),
    notes: normalizeOptionalText(input.notes),
  };
}

function normalizePhotoPaths(photos: EventPhotoInput[]): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];

  for (const photo of photos) {
    const path = photo.storagePath?.trim();

    if (!path || seen.has(path)) {
      continue;
    }

    seen.add(path);
    paths.push(path);
  }

  return paths;
}

async function insertPhotos(
  groupId: string,
  userId: string,
  occurredAt: Date,
  storagePaths: string[],
): Promise<Map<string, string>> {
  const photoIds = new Map<string, string>();

  if (storagePaths.length === 0) {
    return photoIds;
  }

  const { data, error } = await supabase
    .from('photos')
    .insert(
      storagePaths.map((storagePath) => ({
        group_id: groupId,
        uploaded_by: userId,
        storage_path: storagePath,
        caption: null,
        taken_at: occurredAt.toISOString(),
      })),
    )
    .select('id, storage_path');

  if (error) {
    throw new Error(error.message);
  }

  for (const photo of (data ?? []) as InsertedPhotoRow[]) {
    photoIds.set(photo.storage_path, photo.id);
  }

  return photoIds;
}

async function removeStoragePaths(storagePaths: string[]) {
  if (storagePaths.length === 0) {
    return;
  }

  await supabase.storage.from(IMAGE_BUCKET_ID).remove(storagePaths);
}

async function cleanupPhotos(photoIds: string[], storagePaths: string[]) {
  try {
    if (photoIds.length > 0) {
      await supabase.from('photos').delete().in('id', photoIds);
    }

    await removeStoragePaths(storagePaths);
  } catch {
    // Cleanup is best-effort after the event mutation succeeds.
  }
}

export async function listEventsForGroup(
  groupId: string,
): Promise<EventListItem[]> {
  const userId = await getCurrentUserId();

  if (!userId || !groupId) {
    return [];
  }

  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, occurred_on, location_text, mood, created_at')
    .eq('group_id', groupId)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = events ?? [];

  if (rows.length === 0) {
    return [];
  }

  const eventIds = rows.map((event) => event.id);
  const { data: links, error: linksError } = await supabase
    .from('event_photos')
    .select('event_id, sort_order, photos(storage_path)')
    .in('event_id', eventIds)
    .order('event_id', { ascending: true })
    .order('sort_order', { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const coverPathByEventId = new Map<string, string>();

  for (const link of (links ?? []) as EventPhotoLink[]) {
    const storagePath = resolvePhotoStoragePath(link.photos);

    if (!link.event_id || !storagePath) continue;
    if (coverPathByEventId.has(link.event_id)) continue;

    coverPathByEventId.set(link.event_id, storagePath);
  }

  const signedUrls = await getSignedImageUrlMap(
    Array.from(new Set(coverPathByEventId.values())),
  );

  return rows.map((event) => {
    const coverPath = coverPathByEventId.get(event.id);

    return {
      id: event.id,
      title: event.title,
      occurredOn: event.occurred_on,
      locationText: event.location_text,
      mood: event.mood,
      coverImage: coverPath ? signedUrls.get(coverPath) : undefined,
    };
  });
}

export async function createEvent(input: CreateEventInput): Promise<string> {
  assertPhotoLimit(input.photos.length);

  const userId = await requireCurrentUserId(
    'You must be signed in to create an event.',
  );
  if (!input.groupId) {
    throw new Error('A group must be selected before creating an event.');
  }

  const { data: insertedEvent, error: eventError } = await supabase
    .from('events')
    .insert({
      group_id: input.groupId,
      created_by: userId,
      ...getEventValues(input),
    })
    .select('id')
    .single();

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (!insertedEvent?.id) {
    throw new Error('Could not create event.');
  }

  const storagePaths = normalizePhotoPaths(input.photos);

  if (storagePaths.length === 0) {
    return insertedEvent.id;
  }

  const insertedPhotoIds = await insertPhotos(
    input.groupId,
    userId,
    input.occurredAt,
    storagePaths,
  );

  if (insertedPhotoIds.size === 0) {
    return insertedEvent.id;
  }

  const { error: linksError } = await supabase.from('event_photos').insert(
    storagePaths.map((storagePath, index) => ({
      group_id: input.groupId,
      event_id: insertedEvent.id,
      photo_id: insertedPhotoIds.get(storagePath)!,
      sort_order: index,
    })),
  );

  if (linksError) {
    throw new Error(linksError.message);
  }

  return insertedEvent.id;
}

export async function updateEvent(input: UpdateEventInput): Promise<string> {
  assertPhotoLimit(input.photos.length);

  const userId = await requireCurrentUserId(
    'You must be signed in to edit an event.',
  );

  if (!input.groupId) {
    throw new Error('A group must be selected before editing an event.');
  }

  if (!input.eventId) {
    throw new Error('Event not found.');
  }

  const { data: updatedEvent, error: eventError } = await supabase
    .from('events')
    .update(getEventValues(input))
    .eq('id', input.eventId)
    .eq('group_id', input.groupId)
    .select('id')
    .single();

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (!updatedEvent?.id) {
    throw new Error('Could not update event.');
  }

  const { data: currentLinks, error: currentLinksError } = await supabase
    .from('event_photos')
    .select('photo_id, photos(storage_path)')
    .eq('event_id', input.eventId)
    .eq('group_id', input.groupId)
    .order('sort_order', { ascending: true });

  if (currentLinksError) {
    throw new Error(currentLinksError.message);
  }

  const currentPhotoIds = new Map<string, string>();

  for (const link of (currentLinks ?? []) as EventPhotoLink[]) {
    const storagePath = resolvePhotoStoragePath(link.photos);

    if (!storagePath || !link.photo_id) {
      continue;
    }

    currentPhotoIds.set(storagePath, link.photo_id);
  }

  const storagePaths = normalizePhotoPaths(input.photos);
  const nextPathSet = new Set(storagePaths);
  const newPaths = storagePaths.filter((path) => !currentPhotoIds.has(path));
  const removedLinks = Array.from(currentPhotoIds.entries()).filter(
    ([path]) => !nextPathSet.has(path),
  );
  const removedPhotoIds = removedLinks.map(([, photoId]) => photoId);
  const removedStoragePaths = removedLinks.map(([path]) => path);
  const newPhotoIds = await insertPhotos(
    input.groupId,
    userId,
    input.occurredAt,
    newPaths,
  );
  const finalPhotoIds = storagePaths.map(
    (path) => currentPhotoIds.get(path) ?? newPhotoIds.get(path),
  );

  if (finalPhotoIds.some((photoId) => !photoId)) {
    throw new Error('Could not save all event photos.');
  }

  const { error: deleteLinksError } = await supabase
    .from('event_photos')
    .delete()
    .eq('event_id', input.eventId)
    .eq('group_id', input.groupId);

  if (deleteLinksError) {
    throw new Error(deleteLinksError.message);
  }

  if (finalPhotoIds.length > 0) {
    const { error: insertLinksError } = await supabase
      .from('event_photos')
      .insert(
        finalPhotoIds.map((photoId, index) => ({
          group_id: input.groupId,
          event_id: input.eventId,
          photo_id: photoId!,
          sort_order: index,
        })),
      );

    if (insertLinksError) {
      throw new Error(insertLinksError.message);
    }

    const { error: updatePhotosError } = await supabase
      .from('photos')
      .update({ taken_at: input.occurredAt.toISOString() })
      .in(
        'id',
        finalPhotoIds.filter((photoId): photoId is string => Boolean(photoId)),
      );

    if (updatePhotosError) {
      throw new Error(updatePhotosError.message);
    }
  }

  void cleanupPhotos(removedPhotoIds, removedStoragePaths);

  return updatedEvent.id;
}

export async function deleteEvent(eventId: string, groupId: string) {
  await requireCurrentUserId('You must be signed in to delete an event.');

  if (!eventId || !groupId) {
    throw new Error('Event not found.');
  }

  const { data: currentLinks, error: currentLinksError } = await supabase
    .from('event_photos')
    .select('photo_id, photos(storage_path)')
    .eq('event_id', eventId)
    .eq('group_id', groupId);

  if (currentLinksError) {
    throw new Error(currentLinksError.message);
  }

  const photoIds: string[] = [];
  const storagePaths: string[] = [];

  for (const link of (currentLinks ?? []) as EventPhotoLink[]) {
    const storagePath = resolvePhotoStoragePath(link.photos);

    if (link.photo_id) {
      photoIds.push(link.photo_id);
    }

    if (storagePath) {
      storagePaths.push(storagePath);
    }
  }

  const { error: deleteLinksError } = await supabase
    .from('event_photos')
    .delete()
    .eq('event_id', eventId)
    .eq('group_id', groupId);

  if (deleteLinksError) {
    throw new Error(deleteLinksError.message);
  }

  const { error: deleteEventError } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('group_id', groupId);

  if (deleteEventError) {
    throw new Error(deleteEventError.message);
  }

  void cleanupPhotos(photoIds, storagePaths);
}

export async function getEventById(
  eventId: string,
  groupId: string,
): Promise<EventDetail | null> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('id, title, occurred_on, location_text, mood, notes')
    .eq('id', eventId)
    .eq('group_id', groupId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!event) {
    return null;
  }

  const { data: links, error: linksError } = await supabase
    .from('event_photos')
    .select('sort_order, photo_id, photos(storage_path)')
    .eq('event_id', eventId)
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const storagePaths = (links ?? [])
    .map((link) => resolvePhotoStoragePath(link.photos))
    .filter((path): path is string => Boolean(path));

  const signedUrls = await getSignedImageUrlMap(storagePaths);

  return {
    id: event.id,
    title: event.title,
    occurredOn: event.occurred_on,
    locationText: event.location_text,
    mood: event.mood,
    notes: event.notes,
    photos: storagePaths
      .map((path) => {
        const url = signedUrls.get(path);

        if (!url) {
          return null;
        }

        return {
          storagePath: path,
          url,
        };
      })
      .filter((photo): photo is EventDetailPhoto => Boolean(photo)),
  };
}
