-- First Day: per-user daily cap on AI plan generation.
--
-- Every AI-backed sprint generation bills a real Anthropic API key. Sign-up is
-- open to anyone with a Google account, so without a cap one account (or a bot)
-- can run the bill up unattended. One row per successful AI generation; the
-- route counts today's rows before calling the model.
--
-- Deliberately NOT a counter column: an append-only log survives races between
-- concurrent requests without a lock, and doubles as usage history.

create extension if not exists pgcrypto;

create table if not exists public.plan_generations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  sprint     integer not null default 1,
  created_at timestamptz not null default now()
);

-- The only query this table serves: "how many has THIS user logged since midnight".
create index if not exists idx_plan_gen_user_created
  on public.plan_generations (user_id, created_at desc);

alter table public.plan_generations enable row level security;

-- Same isolation contract as goals: a user only ever sees or writes their own rows.
-- The API route acts as the user (it forwards their JWT), so RLS is what stops a
-- caller from logging generations against someone else's quota.
drop policy if exists "plan_gen select own" on public.plan_generations;
create policy "plan_gen select own" on public.plan_generations
  for select using (user_id = auth.uid());

drop policy if exists "plan_gen insert own" on public.plan_generations;
create policy "plan_gen insert own" on public.plan_generations
  for insert with check (user_id = auth.uid());
