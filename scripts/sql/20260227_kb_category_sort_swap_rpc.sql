create or replace function public.swap_kb_category_sort_order(
  p_first uuid,
  p_second uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  first_sort integer;
  second_sort integer;
begin
  if p_first is null or p_second is null then
    raise exception 'Both category ids are required';
  end if;

  if p_first = p_second then
    return;
  end if;

  select sort_order
  into first_sort
  from kb_categories
  where id = p_first
  for update;

  if not found then
    raise exception 'Category % not found', p_first;
  end if;

  select sort_order
  into second_sort
  from kb_categories
  where id = p_second
  for update;

  if not found then
    raise exception 'Category % not found', p_second;
  end if;

  update kb_categories
  set sort_order = case
      when id = p_first then second_sort
      when id = p_second then first_sort
      else sort_order
    end,
    updated_at = now()
  where id in (p_first, p_second);
end;
$$;

grant execute on function public.swap_kb_category_sort_order(uuid, uuid) to authenticated;
