import { supabase } from '@/lib/supabase';

export type EventPhotoInput = {
  id?: string;
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

export type DeleteEventInput = {
  eventId: string;
  groupId: string;
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
  id: string;
  storagePath: string;
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

type RelatedPhotoRow = {
  id?: string | null;
  storage_path?: string | null;
};

type LinkedPhotoRow = {
  event_id?: string | null;
  photos?: RelatedPhotoRow | RelatedPhotoRow[] | null;
};

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function formatDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeEventRecord(input: {
  title: string;
  occurredAt: Date;
  location: string;
  mood: string;
  notes: string;
}) {
  return {
    title: input.title.trim(),
    occurred_on: formatDateOnly(input.occurredAt),
    location_text: normalizeOptionalText(input.location),
    mood: normalizeOptionalText(input.mood),
    notes: normalizeOptionalText(input.notes),
  };
}

function resolveRelatedPhoto(link: LinkedPhotoRow): RelatedPhotoRow | null {
  const relatedPhoto = Array.isArray(link.photos) ? link.photos[0] : link.photos;

  return relatedPhoto ?? null;
}

function resolveStoragePath(link: LinkedPhotoRow): string | null {
  return resolveRelatedPhoto(link)?.storage_path ?? null;
}

function resolveEventDetailPhoto(link: LinkedPhotoRow): EventDetailPhoto | null {
  const relatedPhoto = resolveRelatedPhoto(link);

  if (!relatedPhoto?.id || !relatedPhoto.storage_path) {
    return null;
  }

  return {
    id: relatedPhoto.id,
    storagePath: relatedPhoto.storage_path,
  };
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

async function insertPhotos(
  groupId: string,
  userId: string,
  occurredAt: Date,
  photos: EventPhotoInput[],
): Promise<string[]> {
  const newPhotos = photos.filter((photo) => !photo.id && photo.storagePath);

  if (newPhotos.length === 0) {
    return [];
  }

  const { data: insertedPhotos, error: photosError } = await supabase
    .from('photos')
    .insert(
      newPhotos.map((photo) => ({
        group_id: groupId,
        uploaded_by: userId,
        storage_path: photo.storagePath!,
        caption: null,
        taken_at: occurredAt.toISOString(),
      })),
    )
    .select('id');

  if (photosError) {
    throw new Error(photosError.message);
  }

  return (insertedPhotos ?? []).map((photo) => photo.id);
}

function getExistingPhotoIds(photos: EventPhotoInput[]): string[] {
  return photos
    .filter((photo) => photo.id && photo.storagePath)
    .map((photo) => photo.id!);
}

async function replaceEventPhotos(input: {
  eventId: string;
  groupId: string;
  userId: string;
  occurredAt: Date;
  photos: EventPhotoInput[];
}) {
  const existingPhotoIds = getExistingPhotoIds(input.photos);
  const newPhotoIds = await insertPhotos(
    input.groupId,
    input.userId,
    input.occurredAt,
    input.photos,
  );
  const nextPhotoIds = [...existingPhotoIds, ...newPhotoIds];
  const { error: deleteLinksError } = await supabase
    .from('event_photos')
    .delete()
    .eq('event_id', input.eventId)
    .eq('group_id', input.groupId);

  if (deleteLinksError) {
    throw new Error(deleteLinksError.message);
  }

  if (nextPhotoIds.length === 0) {
    return;
  }

  const { error: linksError } = await supabase.from('event_photos').insert(
    nextPhotoIds.map((photoId, index) => ({
      group_id: input.groupId,
      event_id: input.eventId,
      photo_id: photoId,
      sort_order: index,
    })),
  );

  if (linksError) {
    throw new Error(linksError.message);
  }
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
      ...normalizeEventRecord(input),
    })
    .select('id')
    .single();

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (!insertedEvent?.id) {
    throw new Error('Could not create event.');
  }

  await replaceEventPhotos({
    eventId: insertedEvent.id,
    groupId: input.groupId,
    userId,
    occurredAt: input.occurredAt,
    photos: input.photos,
  });

  return insertedEvent.id;
}

export async function updateEvent(input: UpdateEventInput): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('You must be signed in to update an event.');
  }

  if (!input.groupId) {
    throw new Error('A group must be selected before updating an event.');
  }

  const { data: updatedEvent, error: eventError } = await supabase
    .from('events')
    .update(normalizeEventRecord(input))
    .eq('id', input.eventId)
    .eq('group_id', input.groupId)
    .select('id')
    .maybeSingle();

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (!updatedEvent?.id) {
    throw new Error('Could not update event.');
  }

  await replaceEventPhotos({
    eventId: updatedEvent.id,
    groupId: input.groupId,
    userId,
    occurredAt: input.occurredAt,
    photos: input.photos,
  });

  return updatedEvent.id;
}

export async function deleteEvent(input: DeleteEventInput): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('You must be signed in to delete an event.');
  }

  const { error: linksError } = await supabase
    .from('event_photos')
    .delete()
    .eq('event_id', input.eventId)
    .eq('group_id', input.groupId);

  if (linksError) {
    throw new Error(linksError.message);
  }

  const { error: eventError } = await supabase
    .from('events')
    .delete()
    .eq('id', input.eventId)
    .eq('group_id', input.groupId);

  if (eventError) {
    throw new Error(eventError.message);
  }
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
    .select('sort_order, photos(id, storage_path)')
    .eq('event_id', eventId)
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const photos = (links ?? [])
    .map((link) => resolveEventDetailPhoto(link))
    .filter((photo): photo is EventDetailPhoto => Boolean(photo));

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
