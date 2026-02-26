-- Admin-only RBAC alignment (run manually in Supabase SQL editor)

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
      and ar.role = 'admin'
  );
$$;

-- Optional cleanup: remove legacy editor assignments
-- delete from public.admin_roles where role = 'editor';
