import { supabase } from '@/lib/supabase';

/**
 * Returns the currently signed-in user id, or null if the session is empty.
 * Throws when Supabase returns an explicit error.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user?.id ?? null;
}

/**
 * Same as `getCurrentUserId` but throws when no user is signed in.
 */
export async function requireCurrentUserId(message: string): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error(message);
  }

  return userId;
}

/**
 * Pair of ids most uploads need: the current user and the currently selected
 * group. Cached by the image upload hook via TanStack Query.
 */
export async function getUploadContextForGroup(
  groupId: string | null | undefined,
): Promise<{
  userId: string;
  groupId: string;
}> {
  const userId = await requireCurrentUserId(
    'You must be signed in to perform this action.',
  );

  if (!groupId) {
    throw new Error('Choose a space before uploading photos.');
  }

  return { userId, groupId };
}

/**
 * Shape of a supabase `photos(storage_path)` join in our list queries.
 * Supabase may return a single object or an array depending on the relation,
 * so we normalize to a single storage path (or null).
 */
export type JoinedPhoto =
  | { storage_path?: string | null }
  | { storage_path?: string | null }[]
  | null
  | undefined;

export function resolvePhotoStoragePath(photos: JoinedPhoto): string | null {
  const related = Array.isArray(photos) ? photos[0] : photos;
  return related?.storage_path ?? null;
}
