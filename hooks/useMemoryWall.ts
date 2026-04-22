import { listMemoryWallForGroup } from '@/services/memoryWall';
import { useQuery } from '@tanstack/react-query';

export const memoryWallKeys = {
  all: ['memory-wall'] as const,
  lists: () => [...memoryWallKeys.all, 'list'] as const,
  list: (groupId: string | null) =>
    [...memoryWallKeys.lists(), groupId ?? 'no-group'] as const,
};

export function useMemoryWallQuery(groupId?: string | null) {
  return useQuery({
    queryKey: memoryWallKeys.list(groupId ?? null),
    queryFn: () =>
      groupId ? listMemoryWallForGroup(groupId) : Promise.resolve([]),
  });
}
