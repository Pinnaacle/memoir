import type { SelectedImage } from '@/components/ui/AddImageField';
import { supabase } from './supabase';

export type CreateMomentInput = {
  momentType: string;
  title: string;
  description: string;
  occurredAt: Date;
  photos: SelectedImage[];
};

export type MomentListItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  occurredOn: string;
  coverImage?: string;
};

export async function listMomentsForCurrentUser(): Promise<MomentListItem[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('moments')
    .select('id, title, description, category, occurred_on, created_at')
    .eq('created_by', user.id)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((moment) => ({
    id: moment.id,
    title: moment.title,
    description: moment.description,
    category: moment.category,
    occurredOn: moment.occurred_on,
  }));
}

export async function createMoment(input: CreateMomentInput): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error('You must be signed in to create a moment.');
  }

  const { data: groups, error: groupError } = await supabase
    .from('groups')
    .select('id, name, group_kind')
    .eq('personal_owner_user_id', user.id);

  if (groupError) {
    throw new Error(groupError.message);
  }

  const personalGroup =
    groups?.find((group) => group.group_kind === 'personal') ??
    groups?.find((group) => group.name?.toLowerCase() === 'personal') ??
    groups?.[0];

  if (!personalGroup) {
    throw new Error(
      'No group found for this user yet. The personal group needs to exist before creating moments.',
    );
  }

  const { data: insertedMoment, error: momentError } = await supabase
    .from('moments')
    .insert({
      group_id: personalGroup.id,
      created_by: user.id,
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

  // Only persist photos that have an uploaded storage path.
  // Local-only images can be linked after upload flow lands.
  const persistedPhotoCandidates = input.photos.filter((photo) =>
    Boolean(photo.storagePath),
  );

  if (persistedPhotoCandidates.length === 0) {
    return;
  }

  const { data: insertedPhotos, error: photosError } = await supabase
    .from('photos')
    .insert(
      persistedPhotoCandidates.map((photo) => ({
        group_id: personalGroup.id,
        uploaded_by: user.id,
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
    return;
  }

  const { error: linksError } = await supabase.from('moment_photos').insert(
    insertedPhotos.map((photo, index) => ({
      group_id: personalGroup.id,
      moment_id: insertedMoment.id,
      photo_id: photo.id,
      sort_order: index,
    })),
  );

  if (linksError) {
    throw new Error(linksError.message);
  }
}
