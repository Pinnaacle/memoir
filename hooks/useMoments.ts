import {
  createMoment,
  deleteMoment,
  getMomentById,
  listMomentsForGroup,
  updateMoment,
} from '@/services/moments';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const momentKeys = {
  all: ['moments'] as const,
  lists: () => [...momentKeys.all, 'list'] as const,
  list: (groupId: string | null) =>
    [...momentKeys.lists(), groupId ?? 'no-group'] as const,
  details: () => [...momentKeys.all, 'detail'] as const,
  detail: (momentId: string, groupId: string | null) =>
    [...momentKeys.details(), momentId, groupId ?? 'no-group'] as const,
};

export function useMomentsQuery(groupId?: string | null) {
  return useQuery({
    queryKey: momentKeys.list(groupId ?? null),
    queryFn: () =>
      groupId ? listMomentsForGroup(groupId) : Promise.resolve([]),
  });
}

export function useMomentDetailQuery(
  momentId?: string,
  groupId?: string | null,
) {
  const resolvedGroupId = groupId ?? null;

  return useQuery({
    queryKey: momentKeys.detail(momentId ?? 'missing', resolvedGroupId),
    enabled: Boolean(momentId && resolvedGroupId),
    queryFn: () =>
      momentId && resolvedGroupId
        ? getMomentById(momentId, resolvedGroupId)
        : Promise.resolve(null),
  });
}

export function useCreateMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMoment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: momentKeys.all,
      });
    },
  });
}

export function useUpdateMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMoment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: momentKeys.all,
      });
    },
  });
}

export function useDeleteMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      momentId,
      groupId,
    }: {
      momentId: string;
      groupId: string;
    }) => deleteMoment(momentId, groupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: momentKeys.all,
      });
    },
  });
}
