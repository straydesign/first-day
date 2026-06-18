-- First Day: per-user goals. One row per goal.
-- plan + progress are stored as JSONB (the app always reads/writes them whole).
-- RLS: a user can only see or touch their OWN goals (owner = auth.uid()).
-- This is the per-account isolation guarantee — enforced by Postgres, not app code.

create extension if not exists pgcrypto;

create table if not exists public.goals (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  title              text not null,
  goal               text,
  time_commitment    text,
  time_slot          text,
  available_days     jsonb,                                -- string[]
  wants_weekly_books boolean not null default false,
  context_answers    jsonb,                                -- Record<string,string>
  start_date         text not null,                        -- 'YYYY-MM-DD'
  total_days         integer not null default 28,
  plan               jsonb not null,                       -- full Plan object
  progress           jsonb not null default '{}'::jsonb,   -- ProgressMap
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_goals_user on public.goals (user_id);

-- Touch updated_at on every row update.
create or replace function public.touch_goals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_goals_touch on public.goals;
create trigger trg_goals_touch
  before update on public.goals
  for each row execute function public.touch_goals_updated_at();

-- =====================================================================
-- Row Level Security — the isolation contract
-- =====================================================================

alter table public.goals enable row level security;

-- A user can read ONLY their own goals.
drop policy if exists "goals select own" on public.goals;
create policy "goals select own" on public.goals
  for select using (user_id = auth.uid());

-- A user can insert goals ONLY as themselves (no spoofing user_id).
drop policy if exists "goals insert own" on public.goals;
create policy "goals insert own" on public.goals
  for insert with check (user_id = auth.uid());

-- A user can update ONLY their own goals.
drop policy if exists "goals update own" on public.goals;
create policy "goals update own" on public.goals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A user can delete ONLY their own goals.
drop policy if exists "goals delete own" on public.goals;
create policy "goals delete own" on public.goals
  for delete using (user_id = auth.uid());
