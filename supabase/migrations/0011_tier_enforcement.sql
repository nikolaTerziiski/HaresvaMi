-- Adds menu_extraction_count to usage_counters and an atomic feedback quota function.

alter table public.usage_counters
  add column menu_extraction_count int not null default 0;

create or replace function public.increment_feedback_usage_if_under_limit(
  p_restaurant_id uuid,
  p_period text,
  p_limit int
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new int;
begin
  insert into public.usage_counters (restaurant_id, period, feedback_count)
  values (p_restaurant_id, p_period, 1)
  on conflict (restaurant_id, period) do update
    set feedback_count = public.usage_counters.feedback_count + 1
    where public.usage_counters.feedback_count < p_limit
  returning feedback_count into v_new;

  return v_new;  -- null if no row was updated (limit hit)
end;
$$;

grant execute on function public.increment_feedback_usage_if_under_limit(uuid, text, int) to service_role;
