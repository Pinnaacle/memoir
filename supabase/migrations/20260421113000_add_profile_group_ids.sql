alter table public.profiles
add column if not exists group_ids uuid[] not null default '{}'::uuid[];

comment on column public.profiles.group_ids is
  'Denormalized cache of groups the profile belongs to. Source of truth remains public.group_members.';

create or replace function public.compute_profile_group_ids(profile_user_id uuid)
returns uuid[]
language sql
stable
as $$
  select coalesce(
    array_agg(
      gm.group_id
      order by
        case when g.group_kind = 'personal' then 0 else 1 end,
        gm.joined_at,
        g.created_at,
        gm.group_id
    ),
    '{}'::uuid[]
  )
  from public.group_members as gm
  join public.groups as g on g.id = gm.group_id
  where gm.user_id = profile_user_id;
$$;

create or replace function public.sync_profile_group_ids(profile_user_id uuid)
returns void
language plpgsql
as $$
declare
  next_group_ids uuid[];
begin
  if profile_user_id is null then
    return;
  end if;

  next_group_ids := public.compute_profile_group_ids(profile_user_id);

  update public.profiles as p
  set group_ids = next_group_ids
  where p.id = profile_user_id
    and p.group_ids is distinct from next_group_ids;
end;
$$;

create or replace function public.handle_group_members_profile_group_ids()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_profile_group_ids(old.user_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.user_id is distinct from new.user_id then
    perform public.sync_profile_group_ids(old.user_id);
  end if;

  perform public.sync_profile_group_ids(new.user_id);
  return new;
end;
$$;

drop trigger if exists sync_profiles_group_ids_on_group_members on public.group_members;

create trigger sync_profiles_group_ids_on_group_members
after insert or update or delete on public.group_members
for each row
execute function public.handle_group_members_profile_group_ids();

update public.profiles as p
set group_ids = public.compute_profile_group_ids(p.id);
