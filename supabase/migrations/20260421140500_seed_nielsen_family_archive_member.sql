insert into public.group_members (
  group_id,
  user_id,
  role,
  joined_at,
  created_at
)
select
  '90000000-0000-4000-8000-000000000001'::uuid,
  '9f444fb7-e956-4e7a-8be2-964201bf7391'::uuid,
  'member'::public.group_role,
  timezone('utc', now()),
  timezone('utc', now())
where exists (
  select 1
  from public.groups
  where id = '90000000-0000-4000-8000-000000000001'::uuid
)
and exists (
  select 1
  from public.profiles
  where id = '9f444fb7-e956-4e7a-8be2-964201bf7391'::uuid
)
on conflict (group_id, user_id) do nothing;

do $$
begin
  if to_regprocedure('public.sync_profile_group_ids(uuid)') is not null then
    perform public.sync_profile_group_ids(
      '9f444fb7-e956-4e7a-8be2-964201bf7391'::uuid
    );
  end if;
end;
$$;
