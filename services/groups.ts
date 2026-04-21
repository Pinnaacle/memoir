import { supabase } from '@/lib/supabase';

type GroupRow = {
  id?: string | null;
  name?: string | null;
  group_kind?: string | null;
  personal_owner_user_id?: string | null;
  created_at?: string | null;
};

type GroupMembershipRow = {
  role?: string | null;
  joined_at?: string | null;
  groups?: GroupRow | GroupRow[] | null;
};

type ResolvedGroupRow = {
  id: string;
  name: string;
  group_kind?: string | null;
  personal_owner_user_id?: string | null;
  created_at?: string | null;
};

export type UserGroup = {
  id: string;
  name: string;
  groupKind: string | null;
  personalOwnerUserId: string | null;
  role: string | null;
  joinedAt: string | null;
  createdAt: string | null;
};

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user?.id ?? null;
}

function extractGroup(row: GroupMembershipRow): ResolvedGroupRow | null {
  const group = Array.isArray(row.groups) ? row.groups[0] : row.groups;

  if (!group?.id || !group.name) {
    return null;
  }

  return {
    id: group.id,
    name: group.name,
    group_kind: group.group_kind ?? null,
    personal_owner_user_id: group.personal_owner_user_id ?? null,
    created_at: group.created_at ?? null,
  };
}

function compareUserGroups(left: UserGroup, right: UserGroup): number {
  const leftIsPersonal = left.groupKind === 'personal';
  const rightIsPersonal = right.groupKind === 'personal';

  if (leftIsPersonal !== rightIsPersonal) {
    return leftIsPersonal ? -1 : 1;
  }

  const leftTimestamp = left.joinedAt ?? left.createdAt ?? '';
  const rightTimestamp = right.joinedAt ?? right.createdAt ?? '';

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp.localeCompare(rightTimestamp);
  }

  return left.name.localeCompare(right.name);
}

export async function listGroupsForUser(userId: string): Promise<UserGroup[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(
      'role, joined_at, groups!inner(id, name, group_kind, personal_owner_user_id, created_at)',
    )
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as GroupMembershipRow[])
    .map((row) => {
      const group = extractGroup(row);

      if (!group) {
        return null;
      }

      return {
        id: group.id,
        name: group.name,
        groupKind: group.group_kind ?? null,
        personalOwnerUserId: group.personal_owner_user_id ?? null,
        role: row.role ?? null,
        joinedAt: row.joined_at ?? null,
        createdAt: group.created_at ?? null,
      } satisfies UserGroup;
    })
    .filter((group): group is UserGroup => Boolean(group))
    .sort(compareUserGroups);
}

export async function listGroupsForCurrentUser(): Promise<UserGroup[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  return listGroupsForUser(userId);
}
