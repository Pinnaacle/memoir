import { memoryWallKeys } from '@/hooks/useMemoryWall';
import { timelineKeys } from '@/hooks/useTimelineItems';
import {
  createEvent,
  deleteEvent,
  getEventById,
  listEventsForGroup,
  updateEvent,
} from '@/services/events';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (groupId: string | null) =>
    [...eventKeys.lists(), groupId ?? 'no-group'] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (eventId: string, groupId: string | null) =>
    [...eventKeys.details(), eventId, groupId ?? 'no-group'] as const,
};

export function useEventsQuery(groupId?: string | null) {
  return useQuery({
    queryKey: eventKeys.list(groupId ?? null),
    queryFn: () =>
      groupId ? listEventsForGroup(groupId) : Promise.resolve([]),
  });
}

export function useEventDetailQuery(eventId?: string, groupId?: string | null) {
  const resolvedGroupId = groupId ?? null;

  return useQuery({
    queryKey: eventKeys.detail(eventId ?? 'missing', resolvedGroupId),
    enabled: Boolean(eventId && resolvedGroupId),
    queryFn: () =>
      eventId && resolvedGroupId
        ? getEventById(eventId, resolvedGroupId)
        : Promise.resolve(null),
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: timelineKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: memoryWallKeys.all,
        }),
      ]);
    },
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: timelineKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: memoryWallKeys.all,
        }),
      ]);
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, groupId }: { eventId: string; groupId: string }) =>
      deleteEvent(eventId, groupId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: timelineKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: memoryWallKeys.all,
        }),
      ]);
    },
  });
}
