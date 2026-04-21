import { supabase } from '@/lib/supabase';

export type MomentPhotoInput = {
  storagePath?: string | null;
};

export type CreateMomentInput = {
  groupId: string;
  momentType: string;
  title: string;
  description: string;
  occurredAt: Date;
  photos: MomentPhotoInput[];
};

export type MomentListItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  occurredOn: string;
  coverImage?: string;
};

export type MomentDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  occurredOn: string;
  photos: string[];
};

type LinkedPhotoRow = {
  moment_id?: string | null;
  photos?:
    | { storage_path?: string | null }
    | { storage_path?: string | null }[]
    | null;
};

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

export async function listMomentsForGroup(
  groupId: string,
): Promise<MomentListItem[]> {
  const userId = await getCurrentUserId();

  if (!userId || !groupId) {
    return [];
  }

  const { data: moments, error } = await supabase
    .from('moments')
    .select('id, title, description, category, occurred_on, created_at')
    .eq('group_id', groupId)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = moments ?? [];

  if (rows.length === 0) {
    return [];
  }

  const momentIds = rows.map((moment) => moment.id);
  const { data: links, error: linksError } = await supabase
    .from('moment_photos')
    .select('moment_id, sort_order, photos(storage_path)')
    .in('moment_id', momentIds)
    .order('moment_id', { ascending: true })
    .order('sort_order', { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const coverImageByMomentId = new Map<string, string>();

  for (const link of (links ?? []) as LinkedPhotoRow[]) {
    const momentId = link.moment_id;
    const storagePath = resolveStoragePath(link);

    if (!momentId || !storagePath || coverImageByMomentId.has(momentId)) {
      continue;
    }

    coverImageByMomentId.set(momentId, storagePath);
  }

  return rows.map((moment) => ({
    id: moment.id,
    title: moment.title,
    description: moment.description,
    category: moment.category,
    occurredOn: moment.occurred_on,
    coverImage: coverImageByMomentId.get(moment.id),
  }));
}

export async function createMoment(input: CreateMomentInput): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('You must be signed in to create a moment.');
  }

  if (!input.groupId) {
    throw new Error('A group must be selected before creating a moment.');
  }

  const { data: insertedMoment, error: momentError } = await supabase
    .from('moments')
    .insert({
      group_id: input.groupId,
      created_by: userId,
      category: input.momentType,
      title: input.title.trim(),
      description: input.description.trim(),
      occurred_on: input.occurredAt.toISOString().slice(0, 10),
    })
    .select('id')
    .single();

  if (momentError) {
    throw new Error(momentError.message);
  }

  if (!insertedMoment?.id) {
    throw new Error('Could not create moment.');
  }

  const persistedPhotoCandidates = input.photos.filter((photo) =>
    Boolean(photo.storagePath),
  );

  if (persistedPhotoCandidates.length === 0) {
    return insertedMoment.id;
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
    return insertedMoment.id;
  }

  const { error: linksError } = await supabase.from('moment_photos').insert(
    insertedPhotos.map((photo, index) => ({
      group_id: input.groupId,
      moment_id: insertedMoment.id,
      photo_id: photo.id,
      sort_order: index,
    })),
  );

  if (linksError) {
    throw new Error(linksError.message);
  }

  return insertedMoment.id;
}

export async function getMomentById(
  momentId: string,
  groupId?: string | null,
): Promise<MomentDetail | null> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  let query = supabase
    .from('moments')
    .select('id, title, description, category, occurred_on')
    .eq('id', momentId);

  if (groupId) {
    query = query.eq('group_id', groupId);
  }

  const { data: moment, error: momentError } = await query.maybeSingle();

  if (momentError) {
    throw new Error(momentError.message);
  }

  if (!moment) {
    return null;
  }

  const { data: links, error: linksError } = await supabase
    .from('moment_photos')
    .select('sort_order, photos(storage_path)')
    .eq('moment_id', momentId)
    .order('sort_order', { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const photos = (links ?? [])
    .map((link) => resolveStoragePath(link))
    .filter((path): path is string => Boolean(path));

  return {
    id: moment.id,
    title: moment.title,
    description: moment.description,
    category: moment.category,
    occurredOn: moment.occurred_on,
    photos,
  };
}
