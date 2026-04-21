import { supabase } from '@/lib/supabase';

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

type LinkedPhotoRow = {
  event_id?: string | null;
  photos?:
    | { storage_path?: string | null }
    | { storage_path?: string | null }[]
    | null;
};

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function resolveStoragePath(link: LinkedPhotoRow): string | null {
  const relatedPhoto = Array.isArray(link.photos)
    ? link.photos[0]
    : link.photos;

  return relatedPhoto?.storage_path ?? null;
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user?.id ?? null;
}

export async function listEventsForGroup(groupId: string): Promise<EventListItem[]> {
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
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const coverImageByEventId = new Map<string, string>();

  for (const link of (links ?? []) as LinkedPhotoRow[]) {
    const eventId = link.event_id;
    const storagePath = resolveStoragePath(link);

    if (!eventId || !storagePath || coverImageByEventId.has(eventId)) {
      continue;
    }

    coverImageByEventId.set(eventId, storagePath);
  }

  return rows.map((event) => ({
    id: event.id,
    title: event.title,
    occurredOn: event.occurred_on,
    locationText: event.location_text,
    mood: event.mood,
    coverImage: coverImageByEventId.get(event.id),
  }));
}

export async function createEvent(input: CreateEventInput): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('You must be signed in to create an event.');
  }

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
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const photos = (links ?? [])
    .map((link) => resolveStoragePath(link))
    .filter((path): path is string => Boolean(path));

  return {
    id: event.id,
    title: event.title,
    occurredOn: event.occurred_on,
    locationText: event.location_text,
    mood: event.mood,
    notes: event.notes,
    photos,
  };
}
