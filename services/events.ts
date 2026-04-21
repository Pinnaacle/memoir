import {
  getSignedImageUrlMap,
  MAX_IMAGES_PER_UPLOAD,
} from '@/lib/images';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUserId,
  type JoinedPhoto,
  requireCurrentUserId,
  resolvePhotoStoragePath
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

export type EventListItem = {
  id: string;
  title: string;
  occurredOn: string;
  locationText: string | null;
  mood: string | null;
  coverImage?: string;
};

export type EventDetail = {
  id: string;
  title: string;
  occurredOn: string;
  locationText: string | null;
  mood: string | null;
  notes: string | null;
  photos: string[];
};

type EventPhotoLink = {
  event_id?: string | null;
  photos?: JoinedPhoto;
};

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
  if (input.photos.length > MAX_IMAGES_PER_UPLOAD) {
    throw new Error(
      `You can attach at most ${MAX_IMAGES_PER_UPLOAD} photos to an event.`,
    );
  }

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
      title: input.title.trim(),
      occurred_on: input.occurredAt.toISOString().slice(0, 10),
      location_text: normalizeOptionalText(input.location),
      mood: normalizeOptionalText(input.mood),
      notes: normalizeOptionalText(input.notes),
    })
    .select('id')
    .single();

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (!insertedEvent?.id) {
    throw new Error('Could not create event.');
  }

  const persistedPhotoCandidates = input.photos.filter((photo) =>
    Boolean(photo.storagePath),
  );

  if (persistedPhotoCandidates.length === 0) {
    return insertedEvent.id;
  }

  const { data: insertedPhotos, error: photosError } = await supabase
    .from('photos')
    .insert(
      persistedPhotoCandidates.map((photo) => ({
        group_id: input.groupId,
        uploaded_by: userId,
        storage_path: photo.storagePath!,
        caption: null,
        taken_at: input.occurredAt.toISOString(),
      })),
    )
    .select('id');

  if (photosError) {
    throw new Error(photosError.message);
  }

  if (!insertedPhotos?.length) {
    return insertedEvent.id;
  }

  const { error: linksError } = await supabase.from('event_photos').insert(
    insertedPhotos.map((photo, index) => ({
      group_id: input.groupId,
      event_id: insertedEvent.id,
      photo_id: photo.id,
      sort_order: index,
    })),
  );

  if (linksError) {
    throw new Error(linksError.message);
  }

  return insertedEvent.id;
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
    .select('sort_order, photos(storage_path)')
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
      .map((path) => signedUrls.get(path))
      .filter((url): url is string => Boolean(url)),
  };
}
