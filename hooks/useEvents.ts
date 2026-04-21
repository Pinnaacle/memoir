import {
  createEvent,
  getEventById,
  listEventsForCurrentUser,
} from '@/services/events';
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: () => [...eventKeys.lists(), 'current-user'] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (eventId: string) => [...eventKeys.details(), eventId] as const,
};

export function useEventsQuery() {
  return useQuery({
    queryKey: eventKeys.list(),
    queryFn: listEventsForCurrentUser,
  });
}

export function useEventDetailQuery(eventId?: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventId ?? 'missing'),
    queryFn: eventId ? () => getEventById(eventId) : skipToken,
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: eventKeys.all,
      });
    },
  });
}
