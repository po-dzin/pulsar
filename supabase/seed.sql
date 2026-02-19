insert into public.kb_categories (slug, title_ru, title_en, sort_order)
values
  ('self-regulation', 'Саморегуляция', 'Self-regulation', 10),
  ('sleep-recovery', 'Сон и восстановление', 'Sleep and recovery', 20)
on conflict (slug) do update
set
  title_ru = excluded.title_ru,
  title_en = excluded.title_en,
  sort_order = excluded.sort_order;

insert into public.kb_articles (
  category_id,
  slug,
  title_ru,
  title_en,
  excerpt_ru,
  excerpt_en,
  md_path_ru,
  md_path_en,
  is_published,
  published_at
)
select
  c.id,
  a.slug,
  a.title_ru,
  a.title_en,
  a.excerpt_ru,
  a.excerpt_en,
  a.md_path_ru,
  a.md_path_en,
  true,
  now()
from (
  values
    (
      'self-regulation',
      'regulation-basics',
      'Базовая регуляция',
      'Basic regulation',
      'Короткий старт для восстановления в течение дня',
      'Short daily reset protocol',
      'src/content/kb/ru/regulation-basics.md',
      'src/content/kb/en/regulation-basics.md'
    ),
    (
      'sleep-recovery',
      'sleep-reset',
      'Сон и восстановление',
      'Sleep reset',
      'Минимальный протокол сна для нервной системы',
      'Minimal sleep protocol for nervous system',
      'src/content/kb/ru/sleep-reset.md',
      'src/content/kb/en/sleep-reset.md'
    )
) as a(
  category_slug,
  slug,
  title_ru,
  title_en,
  excerpt_ru,
  excerpt_en,
  md_path_ru,
  md_path_en
)
join public.kb_categories c on c.slug = a.category_slug
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title_ru = excluded.title_ru,
  title_en = excluded.title_en,
  excerpt_ru = excluded.excerpt_ru,
  excerpt_en = excluded.excerpt_en,
  md_path_ru = excluded.md_path_ru,
  md_path_en = excluded.md_path_en,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

-- Add an admin user role manually after first login:
-- insert into public.admin_roles (user_id, role) values ('<auth_user_uuid>', 'admin');
