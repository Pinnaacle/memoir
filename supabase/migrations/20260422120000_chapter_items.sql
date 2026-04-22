create table if not exists public.chapter_items (
  group_id uuid not null,
  chapter_id uuid not null,
  ref_type text not null,
  ref_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint chapter_items_pkey primary key (group_id, chapter_id, ref_type, ref_id),
  constraint chapter_items_group_id_chapter_id_fkey foreign key (group_id, chapter_id)
    references public.chapters (group_id, id) on delete cascade,
  constraint chapter_items_ref_type_check check (ref_type in ('moment', 'event')),
  constraint chapter_items_sort_order_nonnegative check (sort_order >= 0)
);

create index if not exists idx_chapter_items_chapter_order
  on public.chapter_items using btree (group_id, chapter_id, sort_order, created_at);

create index if not exists idx_chapter_items_ref
  on public.chapter_items using btree (group_id, ref_type, ref_id);

-- Note: ref_id is a polymorphic pointer to public.moments.id or public.events.id.
-- Foreign keys to those tables are intentionally omitted because a single column
-- cannot reference two tables; callers are responsible for ensuring referenced
-- rows share the chapter's group_id. A follow-up migration can add triggers to
-- cascade deletes from moments/events if orphan items become a problem.
