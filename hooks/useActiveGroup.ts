import { listGroupsForCurrentUser } from '@/services/groups';
import { useActiveGroupStore } from '@/stores/useActiveGroupStore';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

export function useActiveGroup() {
  const activeGroupId = useActiveGroupStore((state) => state.activeGroupId);
  const hasHydrated = useActiveGroupStore((state) => state.hasHydrated);
  const hydrate = useActiveGroupStore((state) => state.hydrate);
  const setActiveGroupId = useActiveGroupStore(
    (state) => state.setActiveGroupId,
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const groupsQuery = useQuery({
    queryKey: ['groups', 'current-user'],
    queryFn: listGroupsForCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);

  useEffect(() => {
    if (!hasHydrated || groupsQuery.isPending) {
      return;
    }

    if (groups.length === 0) {
      if (activeGroupId !== null) {
        setActiveGroupId(null);
      }

      return;
    }

    const hasStoredGroup = groups.some((group) => group.id === activeGroupId);

    if (hasStoredGroup) {
      return;
    }

    const fallbackGroupId = groups[0]?.id ?? null;

    if (fallbackGroupId !== activeGroupId) {
      setActiveGroupId(fallbackGroupId);
    }
  }, [
    activeGroupId,
    groups,
    groupsQuery.isPending,
    hasHydrated,
    setActiveGroupId,
  ]);

  const activeGroup = useMemo(
    () =>
      groups.find((group) => group.id === activeGroupId) ?? groups[0] ?? null,
    [activeGroupId, groups],
  );
  const errorMessage =
    groupsQuery.error instanceof Error
      ? groupsQuery.error.message
      : groupsQuery.error
        ? 'Failed to load your groups.'
        : null;

  return {
    groups,
    activeGroup,
    activeGroupId: activeGroup?.id ?? null,
    isLoading: !hasHydrated || groupsQuery.isPending,
    errorMessage,
    setActiveGroupId,
  };
}
