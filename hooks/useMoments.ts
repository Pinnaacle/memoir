import {
  createMoment,
  getMomentById,
  listMomentsForCurrentUser,
} from '@/services/moments';
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export const momentKeys = {
  all: ['moments'] as const,
  lists: () => [...momentKeys.all, 'list'] as const,
  list: () => [...momentKeys.lists(), 'current-user'] as const,
  details: () => [...momentKeys.all, 'detail'] as const,
  detail: (momentId: string) => [...momentKeys.details(), momentId] as const,
};

export function useMomentsQuery() {
  return useQuery({
    queryKey: momentKeys.list(),
    queryFn: listMomentsForCurrentUser,
  });
}

export function useMomentDetailQuery(momentId?: string) {
  return useQuery({
    queryKey: momentKeys.detail(momentId ?? 'missing'),
    queryFn: momentId ? () => getMomentById(momentId) : skipToken,
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
