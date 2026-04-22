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

export type UpdateMomentInput = CreateMomentInput & {
  momentId: string;
};

export type MomentListItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  occurredOn: string;
  coverImage?: string;
};

export type MomentDetailPhoto = {
  storagePath: string;
  url: string;
};

export type MomentDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  occurredOn: string;
  photos: MomentDetailPhoto[];
};

type MomentPhotoLink = {
  moment_id?: string | null;
  photo_id?: string | null;
  photos?: JoinedPhoto;
};

type InsertedPhotoRow = {
  id: string;
  storage_path: string;
};

type CollectedPhotoRefs = {
  idsByPath: Map<string, string>;
  photoIds: string[];
  storagePaths: string[];
};

function assertPhotoLimit(photoCount: number) {
  if (photoCount > MAX_IMAGES_PER_UPLOAD) {
    throw new Error(
      `You can attach at most ${MAX_IMAGES_PER_UPLOAD} photos to a moment.`,
    );
  }
}

function getMomentValues(input: CreateMomentInput) {
  return {
    category: input.momentType.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    occurred_on: input.occurredAt.toISOString().slice(0, 10),
  };
}

function normalizePhotoPaths(photos: MomentPhotoInput[]): string[] {
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

function collectPhotoRefs(links: MomentPhotoLink[]): CollectedPhotoRefs {
  const idsByPath = new Map<string, string>();
  const photoIds: string[] = [];
  const storagePaths: string[] = [];

  for (const link of links) {
    const storagePath = resolvePhotoStoragePath(link.photos);

    if (link.photo_id) {
      photoIds.push(link.photo_id);
    }

    if (!storagePath) {
      continue;
    }

    storagePaths.push(storagePath);

    if (link.photo_id) {
      idsByPath.set(storagePath, link.photo_id);
    }
  }

  return {
    idsByPath,
    photoIds,
    storagePaths,
  };
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
    // Cleanup is best-effort after the moment mutation succeeds.
  }
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
  assertPhotoLimit(input.photos.length);

  const userId = await requireCurrentUserId(
    'You must be signed in to create a moment.',
  );

  if (!input.groupId) {
    throw new Error('A group must be selected before creating a moment.');
  }

  const { data: insertedMoment, error: momentError } = await supabase
    .from('moments')
    .insert({
      group_id: input.groupId,
      created_by: userId,
      ...getMomentValues(input),
    })
    .select('id')
    .single();

  if (momentError) {
    throw new Error(momentError.message);
  }

  if (!insertedMoment?.id) {
    throw new Error('Could not create moment.');
  }

  const storagePaths = normalizePhotoPaths(input.photos);

  if (storagePaths.length === 0) {
    return insertedMoment.id;
  }

  const insertedPhotoIds = await insertPhotos(
    input.groupId,
    userId,
    input.occurredAt,
    storagePaths,
  );

  if (insertedPhotoIds.size === 0) {
    return insertedMoment.id;
  }

  const { error: linksError } = await supabase.from('moment_photos').insert(
    storagePaths.map((storagePath, index) => ({
      group_id: input.groupId,
      moment_id: insertedMoment.id,
      photo_id: insertedPhotoIds.get(storagePath)!,
      sort_order: index,
    })),
  );

  if (linksError) {
    throw new Error(linksError.message);
  }

  return insertedMoment.id;
}

export async function updateMoment(input: UpdateMomentInput): Promise<string> {
  assertPhotoLimit(input.photos.length);

  const userId = await requireCurrentUserId(
    'You must be signed in to edit a moment.',
  );

  if (!input.groupId) {
    throw new Error('A group must be selected before editing a moment.');
  }

  if (!input.momentId) {
    throw new Error('Moment not found.');
  }

  const { data: updatedMoment, error: momentError } = await supabase
    .from('moments')
    .update(getMomentValues(input))
    .eq('id', input.momentId)
    .eq('group_id', input.groupId)
    .select('id')
    .single();

  if (momentError) {
    throw new Error(momentError.message);
  }

  if (!updatedMoment?.id) {
    throw new Error('Could not update moment.');
  }

  const { data: currentLinks, error: currentLinksError } = await supabase
    .from('moment_photos')
    .select('photo_id, photos(storage_path)')
    .eq('moment_id', input.momentId)
    .eq('group_id', input.groupId)
    .order('sort_order', { ascending: true });

  if (currentLinksError) {
    throw new Error(currentLinksError.message);
  }

  const currentPhotos = collectPhotoRefs(
    (currentLinks ?? []) as MomentPhotoLink[],
  );
  const currentPhotoIds = currentPhotos.idsByPath;

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
    throw new Error('Could not save all moment photos.');
  }

  const { error: deleteLinksError } = await supabase
    .from('moment_photos')
    .delete()
    .eq('moment_id', input.momentId)
    .eq('group_id', input.groupId);

  if (deleteLinksError) {
    throw new Error(deleteLinksError.message);
  }

  if (finalPhotoIds.length > 0) {
    const { error: insertLinksError } = await supabase
      .from('moment_photos')
      .insert(
        finalPhotoIds.map((photoId, index) => ({
          group_id: input.groupId,
          moment_id: input.momentId,
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

  return updatedMoment.id;
}

export async function deleteMoment(momentId: string, groupId: string) {
  await requireCurrentUserId('You must be signed in to delete a moment.');

  if (!momentId || !groupId) {
    throw new Error('Moment not found.');
  }

  const { data: currentLinks, error: currentLinksError } = await supabase
    .from('moment_photos')
    .select('photo_id, photos(storage_path)')
    .eq('moment_id', momentId)
    .eq('group_id', groupId);

  if (currentLinksError) {
    throw new Error(currentLinksError.message);
  }

  const { photoIds, storagePaths } = collectPhotoRefs(
    (currentLinks ?? []) as MomentPhotoLink[],
  );

  const { error: deleteLinksError } = await supabase
    .from('moment_photos')
    .delete()
    .eq('moment_id', momentId)
    .eq('group_id', groupId);

  if (deleteLinksError) {
    throw new Error(deleteLinksError.message);
  }

  const { error: deleteMomentError } = await supabase
    .from('moments')
    .delete()
    .eq('id', momentId)
    .eq('group_id', groupId);

  if (deleteMomentError) {
    throw new Error(deleteMomentError.message);
  }

  const { error: deleteChapterItemsError } = await supabase
    .from('chapter_items')
    .delete()
    .eq('group_id', groupId)
    .eq('ref_type', 'moment')
    .eq('ref_id', momentId);

  if (deleteChapterItemsError) {
    throw new Error(deleteChapterItemsError.message);
  }

  void cleanupPhotos(photoIds, storagePaths);
}

export async function getMomentById(
  momentId: string,
  groupId: string,
): Promise<MomentDetail | null> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const { data: moment, error: momentError } = await supabase
    .from('moments')
    .select('id, title, description, category, occurred_on')
    .eq('id', momentId)
    .eq('group_id', groupId)
    .maybeSingle();

  if (momentError) {
    throw new Error(momentError.message);
  }

  if (!moment) {
    return null;
  }

  const { data: links, error: linksError } = await supabase
    .from('moment_photos')
    .select('sort_order, photo_id, photos(storage_path)')
    .eq('moment_id', momentId)
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const { storagePaths } = collectPhotoRefs((links ?? []) as MomentPhotoLink[]);

  const signedUrls = await getSignedImageUrlMap(storagePaths);

  return {
    id: moment.id,
    title: moment.title,
    description: moment.description,
    category: moment.category,
    occurredOn: moment.occurred_on,
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
      .filter((photo): photo is MomentDetailPhoto => Boolean(photo)),
  };
}
