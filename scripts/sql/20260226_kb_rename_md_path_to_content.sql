-- Normalize KB article content columns:
-- md_path_ru/md_path_en -> content_ru/content_en
--
-- Safe for mixed states:
-- 1) If only md_path_* exists: rename to content_*.
-- 2) If both sets exist: backfill empty content_* from md_path_*, then drop md_path_*.
-- 3) Enforce NOT NULL + default '' for content_*.

begin;

do $$
declare
  has_content_ru boolean;
  has_content_en boolean;
  has_md_path_ru boolean;
  has_md_path_en boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'kb_articles'
      and column_name = 'content_ru'
  ) into has_content_ru;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'kb_articles'
      and column_name = 'content_en'
  ) into has_content_en;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'kb_articles'
      and column_name = 'md_path_ru'
  ) into has_md_path_ru;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'kb_articles'
      and column_name = 'md_path_en'
  ) into has_md_path_en;

  -- RU
  if not has_content_ru and has_md_path_ru then
    execute 'alter table public.kb_articles rename column md_path_ru to content_ru';
  elsif has_content_ru and has_md_path_ru then
    execute $sql$
      update public.kb_articles
      set content_ru = md_path_ru
      where (content_ru is null or btrim(content_ru) = '')
        and md_path_ru is not null
    $sql$;
    execute 'alter table public.kb_articles drop column md_path_ru';
  end if;

  -- EN
  if not has_content_en and has_md_path_en then
    execute 'alter table public.kb_articles rename column md_path_en to content_en';
  elsif has_content_en and has_md_path_en then
    execute $sql$
      update public.kb_articles
      set content_en = md_path_en
      where (content_en is null or btrim(content_en) = '')
        and md_path_en is not null
    $sql$;
    execute 'alter table public.kb_articles drop column md_path_en';
  end if;
end $$;

update public.kb_articles
set
  content_ru = coalesce(content_ru, ''),
  content_en = coalesce(content_en, '')
where content_ru is null
   or content_en is null;

alter table public.kb_articles
  alter column content_ru set default '',
  alter column content_en set default '',
  alter column content_ru set not null,
  alter column content_en set not null;

commit;

