-- Cascade chapter_items cleanup when a referenced moment or event is deleted.
-- chapter_items.ref_id is polymorphic (moments.id or events.id), so it cannot
-- use a standard foreign key. These triggers keep chapter content consistent
-- so chapters don't silently lose entries when the underlying memory is gone.

create or replace function public.delete_chapter_items_for_moment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.chapter_items
  where ref_type = 'moment'
    and ref_id = old.id
    and group_id = old.group_id;
  return old;
end;
$$;

drop trigger if exists trg_chapter_items_cleanup_moment on public.moments;
create trigger trg_chapter_items_cleanup_moment
  before delete on public.moments
  for each row
  execute function public.delete_chapter_items_for_moment();

create or replace function public.delete_chapter_items_for_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.chapter_items
  where ref_type = 'event'
    and ref_id = old.id
    and group_id = old.group_id;
  return old;
end;
$$;

drop trigger if exists trg_chapter_items_cleanup_event on public.events;
create trigger trg_chapter_items_cleanup_event
  before delete on public.events
  for each row
  execute function public.delete_chapter_items_for_event();

-- Backfill: remove any orphan chapter_items already pointing at missing refs.
delete from public.chapter_items ci
where ci.ref_type = 'moment'
  and not exists (
    select 1 from public.moments m
    where m.id = ci.ref_id
      and m.group_id = ci.group_id
  );

delete from public.chapter_items ci
where ci.ref_type = 'event'
  and not exists (
    select 1 from public.events e
    where e.id = ci.ref_id
      and e.group_id = ci.group_id
  );
