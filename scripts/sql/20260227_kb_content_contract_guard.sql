-- Enforce KB content contract:
-- 1) content_ru/content_en must exist and be NOT NULL (already normalized by previous migration)
-- 2) legacy md-path values like "src/content/kb/.../*.md" must not be rendered as article content
-- 3) sanitize existing legacy rows and add DB-level guard against new legacy values

begin;

-- Sanitize legacy path-like payloads that can appear after old seed replay.
update public.kb_articles
set content_ru = ''
where content_ru ~* '^\\s*src/content/kb/.+\\.md\\s*$';

update public.kb_articles
set content_en = ''
where content_en ~* '^\\s*src/content/kb/.+\\.md\\s*$';

-- Hard guard: prevent reintroducing md-path strings into content columns.
alter table public.kb_articles
  drop constraint if exists kb_articles_content_ru_not_md_path,
  drop constraint if exists kb_articles_content_en_not_md_path;

alter table public.kb_articles
  add constraint kb_articles_content_ru_not_md_path
    check (content_ru !~* '^\\s*src/content/kb/.+\\.md\\s*$'),
  add constraint kb_articles_content_en_not_md_path
    check (content_en !~* '^\\s*src/content/kb/.+\\.md\\s*$');

commit;

