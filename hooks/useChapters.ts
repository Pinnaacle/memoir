import {
  createChapter,
  deleteChapter,
  getChapterById,
  listChaptersForGroup,
} from '@/services/chapters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const chapterKeys = {
  all: ['chapters'] as const,
  lists: () => [...chapterKeys.all, 'list'] as const,
  list: (groupId: string | null) =>
    [...chapterKeys.lists(), groupId ?? 'no-group'] as const,
  details: () => [...chapterKeys.all, 'detail'] as const,
  detail: (chapterId: string, groupId: string | null) =>
    [...chapterKeys.details(), chapterId, groupId ?? 'no-group'] as const,
};

export function useChaptersQuery(groupId?: string | null) {
  return useQuery({
    queryKey: chapterKeys.list(groupId ?? null),
    queryFn: () =>
      groupId ? listChaptersForGroup(groupId) : Promise.resolve([]),
  });
}

export function useChapterDetailQuery(
  chapterId?: string,
  groupId?: string | null,
) {
  const resolvedGroupId = groupId ?? null;

  return useQuery({
    queryKey: chapterKeys.detail(chapterId ?? 'missing', resolvedGroupId),
    enabled: Boolean(chapterId && resolvedGroupId),
    queryFn: () =>
      chapterId && resolvedGroupId
        ? getChapterById(chapterId, resolvedGroupId)
        : Promise.resolve(null),
  });
}

export function useCreateChapterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChapter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: chapterKeys.all,
      });
    },
  });
}

export function useDeleteChapterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterId,
      groupId,
    }: {
      chapterId: string;
      groupId: string;
    }) => deleteChapter(chapterId, groupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: chapterKeys.all,
      });
    },
  });
}
