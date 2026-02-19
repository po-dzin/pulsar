create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  locale text not null default 'ru' check (locale in ('ru', 'en')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_type text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  consent_accepted_at timestamptz
);

create table if not exists public.test_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  question_key text not null,
  answer_key text not null,
  score int not null check (score between 0 and 100),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, question_key)
);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_type text not null,
  overall_pct int not null check (overall_pct between 0 and 100),
  level text not null,
  zones_json jsonb not null default '[]'::jsonb,
  flags_json jsonb not null default '[]'::jsonb,
  recommendations_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, test_type)
);

create table if not exists public.consultation_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  contact text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kb_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ru text not null,
  title_en text not null,
  sort_order int not null default 100
);

create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.kb_categories(id) on delete cascade,
  slug text not null unique,
  title_ru text not null,
  title_en text not null,
  excerpt_ru text not null,
  excerpt_en text not null,
  md_path_ru text not null,
  md_path_en text not null,
  is_published boolean not null default false,
  published_at timestamptz
);

create table if not exists public.waitlist_second_test (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  locale text not null default 'ru' check (locale in ('ru', 'en')),
  created_at timestamptz not null default now(),
  unique (user_id, email)
);

create table if not exists public.event_log (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_created_at on public.profiles (created_at desc);
create index if not exists idx_test_sessions_user_id on public.test_sessions (user_id);
create index if not exists idx_test_sessions_created_at on public.test_sessions (started_at desc);
create index if not exists idx_test_answers_session_id on public.test_answers (session_id);
create index if not exists idx_test_results_user_id on public.test_results (user_id);
create index if not exists idx_test_results_created_at on public.test_results (created_at desc);
create index if not exists idx_consultation_leads_status on public.consultation_leads (status);
create index if not exists idx_consultation_leads_created_at on public.consultation_leads (created_at desc);
create index if not exists idx_waitlist_second_test_created_at on public.waitlist_second_test (created_at desc);
create index if not exists idx_event_log_user_id on public.event_log (user_id);
create index if not exists idx_event_log_created_at on public.event_log (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_test_answers_set_updated_at on public.test_answers;
create trigger trg_test_answers_set_updated_at
before update on public.test_answers
for each row execute function public.set_updated_at();

drop trigger if exists trg_consultation_leads_set_updated_at on public.consultation_leads;
create trigger trg_consultation_leads_set_updated_at
before update on public.consultation_leads
for each row execute function public.set_updated_at();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = uid
      and ar.role in ('admin', 'editor')
  );
$$;

alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.test_sessions enable row level security;
alter table public.test_answers enable row level security;
alter table public.test_results enable row level security;
alter table public.consultation_leads enable row level security;
alter table public.kb_categories enable row level security;
alter table public.kb_articles enable row level security;
alter table public.waitlist_second_test enable row level security;
alter table public.event_log enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read"
on public.profiles for select
using (public.is_admin(auth.uid()));

drop policy if exists "admin_roles_self_select" on public.admin_roles;
create policy "admin_roles_self_select"
on public.admin_roles for select
using (auth.uid() = user_id);

drop policy if exists "admin_roles_admin_manage" on public.admin_roles;
create policy "admin_roles_admin_manage"
on public.admin_roles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "test_sessions_self_select" on public.test_sessions;
create policy "test_sessions_self_select"
on public.test_sessions for select
using (auth.uid() = user_id);

drop policy if exists "test_sessions_self_insert" on public.test_sessions;
create policy "test_sessions_self_insert"
on public.test_sessions for insert
with check (auth.uid() = user_id);

drop policy if exists "test_sessions_self_update" on public.test_sessions;
create policy "test_sessions_self_update"
on public.test_sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "test_sessions_admin_read" on public.test_sessions;
create policy "test_sessions_admin_read"
on public.test_sessions for select
using (public.is_admin(auth.uid()));

drop policy if exists "test_answers_self_select" on public.test_answers;
create policy "test_answers_self_select"
on public.test_answers for select
using (
  exists (
    select 1
    from public.test_sessions s
    where s.id = test_answers.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "test_answers_self_insert" on public.test_answers;
create policy "test_answers_self_insert"
on public.test_answers for insert
with check (
  exists (
    select 1
    from public.test_sessions s
    where s.id = test_answers.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "test_answers_self_update" on public.test_answers;
create policy "test_answers_self_update"
on public.test_answers for update
using (
  exists (
    select 1
    from public.test_sessions s
    where s.id = test_answers.session_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.test_sessions s
    where s.id = test_answers.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "test_answers_admin_read" on public.test_answers;
create policy "test_answers_admin_read"
on public.test_answers for select
using (public.is_admin(auth.uid()));

drop policy if exists "test_results_self_select" on public.test_results;
create policy "test_results_self_select"
on public.test_results for select
using (auth.uid() = user_id);

drop policy if exists "test_results_self_insert" on public.test_results;
create policy "test_results_self_insert"
on public.test_results for insert
with check (auth.uid() = user_id);

drop policy if exists "test_results_admin_read" on public.test_results;
create policy "test_results_admin_read"
on public.test_results for select
using (public.is_admin(auth.uid()));

drop policy if exists "consultation_leads_self_select" on public.consultation_leads;
create policy "consultation_leads_self_select"
on public.consultation_leads for select
using (auth.uid() = user_id);

drop policy if exists "consultation_leads_self_insert" on public.consultation_leads;
create policy "consultation_leads_self_insert"
on public.consultation_leads for insert
with check (auth.uid() = user_id);

drop policy if exists "consultation_leads_admin_read" on public.consultation_leads;
create policy "consultation_leads_admin_read"
on public.consultation_leads for select
using (public.is_admin(auth.uid()));

drop policy if exists "consultation_leads_admin_update" on public.consultation_leads;
create policy "consultation_leads_admin_update"
on public.consultation_leads for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "kb_categories_public_read" on public.kb_categories;
create policy "kb_categories_public_read"
on public.kb_categories for select
using (true);

drop policy if exists "kb_categories_admin_write" on public.kb_categories;
create policy "kb_categories_admin_write"
on public.kb_categories for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "kb_articles_public_read" on public.kb_articles;
create policy "kb_articles_public_read"
on public.kb_articles for select
using (is_published = true or public.is_admin(auth.uid()));

drop policy if exists "kb_articles_admin_write" on public.kb_articles;
create policy "kb_articles_admin_write"
on public.kb_articles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "waitlist_self_select" on public.waitlist_second_test;
create policy "waitlist_self_select"
on public.waitlist_second_test for select
using (auth.uid() = user_id);

drop policy if exists "waitlist_self_insert" on public.waitlist_second_test;
create policy "waitlist_self_insert"
on public.waitlist_second_test for insert
with check (auth.uid() = user_id);

drop policy if exists "waitlist_admin_read" on public.waitlist_second_test;
create policy "waitlist_admin_read"
on public.waitlist_second_test for select
using (public.is_admin(auth.uid()));

drop policy if exists "event_log_auth_insert" on public.event_log;
create policy "event_log_auth_insert"
on public.event_log for insert
with check (
  auth.uid() is not null
  and (user_id is null or user_id = auth.uid())
);

drop policy if exists "event_log_admin_read" on public.event_log;
create policy "event_log_admin_read"
on public.event_log for select
using (public.is_admin(auth.uid()));
