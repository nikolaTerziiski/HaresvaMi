-- Caches AI-generated plain-Bulgarian insight summaries per restaurant per period.

create table public.insight_summaries (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  summary_text text not null,
  generated_at timestamptz not null default now(),
  unique (restaurant_id, period_start, period_end)
);

alter table public.insight_summaries enable row level security;

-- Owners can read summaries for their own restaurant.
create policy "insight_summaries_owner_select" on public.insight_summaries
  for select using (
    restaurant_id in (
      select id from public.restaurants where owner_id = auth.uid()
    )
  );

-- Inserts and updates come from the server route using the service role only.
-- No client-side write policy is needed; the absence of INSERT/UPDATE/DELETE
-- policies means authenticated and anon clients cannot write.
