import { memoryWallKeys } from '@/hooks/useMemoryWall';
import { timelineKeys } from '@/hooks/useTimelineItems';
import {
  type CreateMomentInput,
  type MomentDetail,
  type MomentDetailPhoto,
  type MomentListItem,
  type UpdateMomentInput,
  createMoment,
  deleteMoment,
  getMomentById,
  listMomentsForGroup,
  updateMoment,
} from '@/services/moments';
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

type OptimisticMomentData = {
  coverImage?: string;
  photos?: MomentDetailPhoto[];
};

export type CreateMomentMutationInput = CreateMomentInput & {
  optimistic?: OptimisticMomentData;
};

export type UpdateMomentMutationInput = UpdateMomentInput & {
  optimistic?: OptimisticMomentData;
};

type DeleteMomentMutationInput = {
  groupId: string;
  momentId: string;
};

type MomentMutationContext = {
  detail?: MomentDetail | null;
  groupId: string;
  list?: MomentListItem[];
  tempId?: string;
};

function getOccurredOn(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildMomentListItem(
  momentId: string,
  input: CreateMomentMutationInput | UpdateMomentMutationInput,
): MomentListItem {
  const description = input.description.trim();
  const category = input.momentType.trim();

  return {
    id: momentId,
    title: input.title.trim(),
    description: description.length > 0 ? description : null,
    category: category.length > 0 ? category : null,
    occurredOn: getOccurredOn(input.occurredAt),
    coverImage: input.optimistic?.coverImage,
  };
}

function buildMomentDetail(
  momentId: string,
  input: CreateMomentMutationInput | UpdateMomentMutationInput,
): MomentDetail {
  const description = input.description.trim();
  const category = input.momentType.trim();

  return {
    id: momentId,
    title: input.title.trim(),
    description: description.length > 0 ? description : null,
    category: category.length > 0 ? category : null,
    occurredOn: getOccurredOn(input.occurredAt),
    photos: input.optimistic?.photos ?? [],
  };
}

function replaceMomentInList(
  list: MomentListItem[],
  momentId: string,
  nextMoment: MomentListItem,
) {
  const existingIndex = list.findIndex((moment) => moment.id === momentId);

  if (existingIndex === -1) {
    return [nextMoment, ...list];
  }

  return list.map((moment) => (moment.id === momentId ? nextMoment : moment));
}

function getMomentList(queryClient: QueryClient, groupId: string) {
  return queryClient.getQueryData<MomentListItem[]>(momentKeys.list(groupId));
}

function getMomentDetail(
  queryClient: QueryClient,
  groupId: string,
  momentId: string,
) {
  return queryClient.getQueryData<MomentDetail | null>(
    momentKeys.detail(momentId, groupId),
  );
}

function setMomentList(
  queryClient: QueryClient,
  groupId: string,
  updater: (current: MomentListItem[]) => MomentListItem[],
) {
  queryClient.setQueryData<MomentListItem[]>(
    momentKeys.list(groupId),
    (current = []) => updater(current),
  );
}

function setMomentDetail(
  queryClient: QueryClient,
  groupId: string,
  momentId: string,
  detail: MomentDetail,
) {
  queryClient.setQueryData(momentKeys.detail(momentId, groupId), detail);
}

function restoreMomentCache(
  queryClient: QueryClient,
  context: MomentMutationContext,
  momentId?: string,
) {
  queryClient.setQueryData(momentKeys.list(context.groupId), context.list);

  if (momentId) {
    queryClient.setQueryData(
      momentKeys.detail(momentId, context.groupId),
      context.detail,
    );
  }
}

async function cancelMomentQueries(
  queryClient: QueryClient,
  groupId: string,
  momentId?: string,
) {
  await queryClient.cancelQueries({
    queryKey: momentKeys.list(groupId),
  });

  if (momentId) {
    await queryClient.cancelQueries({
      queryKey: momentKeys.detail(momentId, groupId),
    });
  }
}

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

  return useMutation<
    string,
    Error,
    CreateMomentMutationInput,
    MomentMutationContext
  >({
    mutationFn: ({ optimistic: _optimistic, ...input }) => createMoment(input),
    onMutate: async (input) => {
      await cancelMomentQueries(queryClient, input.groupId);

      const tempId = `optimistic-moment-${Date.now()}`;
      const context = {
        groupId: input.groupId,
        list: getMomentList(queryClient, input.groupId),
        tempId,
      };

      setMomentList(queryClient, input.groupId, (current) => [
        buildMomentListItem(tempId, input),
        ...current,
      ]);
      setMomentDetail(
        queryClient,
        input.groupId,
        tempId,
        buildMomentDetail(tempId, input),
      );

      return context;
    },
    onError: (_error, _input, context) => {
      if (!context) {
        return;
      }

      restoreMomentCache(queryClient, context);
      queryClient.removeQueries({
        exact: true,
        queryKey: momentKeys.detail(context.tempId!, context.groupId),
      });
    },
    onSuccess: (momentId, input, context) => {
      if (!context?.tempId) {
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: momentKeys.all,
          }),
          queryClient.invalidateQueries({
            queryKey: timelineKeys.all,
          }),
          queryClient.invalidateQueries({
            queryKey: memoryWallKeys.all,
          }),
        ]);
        return;
      }

      const nextMoment = buildMomentListItem(momentId, input);

      setMomentList(queryClient, input.groupId, (current) =>
        replaceMomentInList(current, context.tempId!, nextMoment),
      );
      setMomentDetail(
        queryClient,
        input.groupId,
        momentId,
        buildMomentDetail(momentId, input),
      );
      queryClient.removeQueries({
        exact: true,
        queryKey: momentKeys.detail(context.tempId, input.groupId),
      });
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: momentKeys.all,
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

export function useUpdateMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    string,
    Error,
    UpdateMomentMutationInput,
    MomentMutationContext
  >({
    mutationFn: ({ optimistic: _optimistic, ...input }) => updateMoment(input),
    onMutate: async (input) => {
      await cancelMomentQueries(queryClient, input.groupId, input.momentId);

      const context = {
        detail: getMomentDetail(queryClient, input.groupId, input.momentId),
        groupId: input.groupId,
        list: getMomentList(queryClient, input.groupId),
      };

      setMomentList(queryClient, input.groupId, (current) =>
        replaceMomentInList(
          current,
          input.momentId,
          buildMomentListItem(input.momentId, input),
        ),
      );
      setMomentDetail(
        queryClient,
        input.groupId,
        input.momentId,
        buildMomentDetail(input.momentId, input),
      );

      return context;
    },
    onError: (_error, input, context) => {
      if (!context) {
        return;
      }

      restoreMomentCache(queryClient, context, input.momentId);
    },
    onSuccess: (momentId, input) => {
      setMomentDetail(
        queryClient,
        input.groupId,
        momentId,
        buildMomentDetail(momentId, input),
      );
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: momentKeys.all,
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

export function useDeleteMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    DeleteMomentMutationInput,
    MomentMutationContext
  >({
    mutationFn: ({ momentId, groupId }) => deleteMoment(momentId, groupId),
    onMutate: async (input) => {
      await cancelMomentQueries(queryClient, input.groupId, input.momentId);

      const context = {
        detail: getMomentDetail(queryClient, input.groupId, input.momentId),
        groupId: input.groupId,
        list: getMomentList(queryClient, input.groupId),
      };

      setMomentList(queryClient, input.groupId, (current) =>
        current.filter((moment) => moment.id !== input.momentId),
      );

      return context;
    },
    onError: (_error, input, context) => {
      if (!context) {
        return;
      }

      restoreMomentCache(queryClient, context, input.momentId);
    },
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: momentKeys.lists(),
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
