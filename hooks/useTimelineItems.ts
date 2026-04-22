import { listTimelineItemsForGroup } from '@/services/timelineItems';
import { useQuery } from '@tanstack/react-query';

export const timelineKeys = {
  all: ['timeline-items'] as const,
  lists: () => [...timelineKeys.all, 'list'] as const,
  list: (groupId: string | null) =>
    [...timelineKeys.lists(), groupId ?? 'no-group'] as const,
};

export function useTimelineItemsQuery(groupId?: string | null) {
  return useQuery({
    queryKey: timelineKeys.list(groupId ?? null),
    queryFn: () =>
      groupId ? listTimelineItemsForGroup(groupId) : Promise.resolve([]),
  });
}
