-- Atomic, clamped decrement used to roll back a feedback usage increment
-- when the session/ratings insert fails. Avoids the stale read-modify-write
-- in application code.
create or replace function public.decrement_feedback_usage(
  p_restaurant_id uuid,
  p_period text
) returns void
language sql
security definer
set search_path = public
as $$
  update usage_counters
     set feedback_count = greatest(feedback_count - 1, 0)
   where restaurant_id = p_restaurant_id
     and period = p_period;
$$;

grant execute on function public.decrement_feedback_usage(uuid, text) to service_role;
