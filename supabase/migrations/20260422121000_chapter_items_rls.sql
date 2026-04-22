alter table public.chapter_items enable row level security;

drop policy if exists "chapter_items_select_members"
  on public.chapter_items;

drop policy if exists "chapter_items_insert_members"
  on public.chapter_items;

drop policy if exists "chapter_items_update_members"
  on public.chapter_items;

drop policy if exists "chapter_items_delete_members"
  on public.chapter_items;

create policy "chapter_items_select_members"
  on public.chapter_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = chapter_items.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "chapter_items_insert_members"
  on public.chapter_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = chapter_items.group_id
        and gm.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.chapters c
      where c.group_id = chapter_items.group_id
        and c.id = chapter_items.chapter_id
    )
  );

create policy "chapter_items_update_members"
  on public.chapter_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = chapter_items.group_id
        and gm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = chapter_items.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "chapter_items_delete_members"
  on public.chapter_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = chapter_items.group_id
        and gm.user_id = auth.uid()
    )
  );
