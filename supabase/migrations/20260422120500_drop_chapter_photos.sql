-- The `chapter_photos` table was originally added to let chapters own their own
-- photos, but chapters have since become a bundle of existing moments/events
-- whose covers are derived from `moment_photos` / `event_photos`. The table was
-- never written to by the app, so we drop it here to keep the schema clean.

drop index if exists public.idx_chapter_photos_chapter_order;
drop index if exists public.idx_chapter_photos_photo;

drop table if exists public.chapter_photos;
