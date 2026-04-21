import {
  getSignedImageUrlMap,
  MAX_IMAGES_PER_UPLOAD,
} from '@/lib/images';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUserId,
  getPersonalGroupIdForUser,
  type JoinedPhoto,
  requireCurrentUserId,
  resolvePhotoStoragePath,
} from '@/services/userContext';

export type MomentPhotoInput = {
  storagePath?: string | null;
};

export type CreateMomentInput = {
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

type MomentPhotoLink = {
  moment_id?: string | null;
  photos?: JoinedPhoto;
};

export async function listMomentsForCurrentUser(): Promise<MomentListItem[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const { data: moments, error } = await supabase
    .from('moments')
    .select('id, title, description, category, occurred_on, created_at')
    .eq('created_by', userId)
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

  const coverPathByMomentId = new Map<string, string>();

  for (const link of (links ?? []) as MomentPhotoLink[]) {
    const storagePath = resolvePhotoStoragePath(link.photos);

    if (!link.moment_id || !storagePath) continue;
    if (coverPathByMomentId.has(link.moment_id)) continue;

    coverPathByMomentId.set(link.moment_id, storagePath);
  }

  const signedUrls = await getSignedImageUrlMap(
    Array.from(new Set(coverPathByMomentId.values())),
  );

  return rows.map((moment) => {
    const coverPath = coverPathByMomentId.get(moment.id);

    return {
      id: moment.id,
      title: moment.title,
      description: moment.description,
      category: moment.category,
      occurredOn: moment.occurred_on,
      coverImage: coverPath ? signedUrls.get(coverPath) : undefined,
    };
  });
}

export async function createMoment(input: CreateMomentInput): Promise<string> {
  if (input.photos.length > MAX_IMAGES_PER_UPLOAD) {
    throw new Error(
      `You can attach at most ${MAX_IMAGES_PER_UPLOAD} photos to a moment.`,
    );
  }

  const userId = await requireCurrentUserId(
    'You must be signed in to create a moment.',
  );
  const groupId = await getPersonalGroupIdForUser(userId);

  const { data: insertedMoment, error: momentError } = await supabase
    .from('moments')
    .insert({
      group_id: groupId,
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
        group_id: groupId,
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
      group_id: groupId,
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
): Promise<MomentDetail | null> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const { data: moment, error: momentError } = await supabase
    .from('moments')
    .select('id, title, description, category, occurred_on')
    .eq('id', momentId)
    .eq('created_by', userId)
    .maybeSingle();

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

  const storagePaths = (links ?? [])
    .map((link) => resolvePhotoStoragePath(link.photos))
    .filter((path): path is string => Boolean(path));

  const signedUrls = await getSignedImageUrlMap(storagePaths);

  return {
    id: moment.id,
    title: moment.title,
    description: moment.description,
    category: moment.category,
    occurredOn: moment.occurred_on,
    photos: storagePaths
      .map((path) => signedUrls.get(path))
      .filter((url): url is string => Boolean(url)),
  };
}
