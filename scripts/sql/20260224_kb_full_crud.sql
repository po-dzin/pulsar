-- KB Full CRUD support (run manually in Supabase SQL editor)

alter table public.kb_categories
  add column if not exists is_archived boolean not null default false,
  add column if not exists updated_at timestamptz;

alter table public.kb_articles
  add column if not exists is_archived boolean not null default false,
  add column if not exists updated_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_kb_articles_category_publish_archive
  on public.kb_articles (category_id, is_published, is_archived);

create index if not exists idx_kb_categories_sort_archive
  on public.kb_categories (sort_order, is_archived);

-- Public read constraints for KB
-- Drop/recreate because older policies may not include is_archived.
drop policy if exists "kb_categories_public_read" on public.kb_categories;
create policy "kb_categories_public_read"
on public.kb_categories for select
using (is_archived = false);

drop policy if exists "kb_articles_public_read" on public.kb_articles;
create policy "kb_articles_public_read"
on public.kb_articles for select
using (
  (is_published = true and is_archived = false)
  or public.is_admin(auth.uid())
);

-- Admin write stays admin-only
drop policy if exists "kb_categories_admin_write" on public.kb_categories;
create policy "kb_categories_admin_write"
on public.kb_categories for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "kb_articles_admin_write" on public.kb_articles;
create policy "kb_articles_admin_write"
on public.kb_articles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
