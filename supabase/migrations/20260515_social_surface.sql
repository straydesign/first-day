-- First Day social surface: gallery rooms + mortared reaction tiles.
-- Privacy contract: published_plan_json is a REDACTED projection
-- (cleanedGoal + days[].title only). NEVER store raw plan / contextAnswers / why.

create extension if not exists pgcrypto;

create table if not exists public.public_rooms (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid not null references auth.users(id) on delete cascade,
  goal_title      text not null,
  cleaned_goal    text,
  -- REDACTED projection only. Validated client-side; RLS forbids raw plan upserts.
  published_plan_json jsonb not null,
  -- Poisson-disk seeded once at publish; never reshuffled.
  position_x      real not null,
  position_y      real not null,
  position_z      real not null,
  -- Hue family seeded from goal sentiment hash (warm/cool/spark/etc).
  color           text not null,
  is_public       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- One published room per owner. Re-publish updates in place.
  unique (owner_user_id)
);

create index if not exists idx_public_rooms_public on public.public_rooms (is_public) where is_public = true;
create index if not exists idx_public_rooms_owner on public.public_rooms (owner_user_id);

-- Mood tiles, not emoji. Five fixed kinds; reaction = a tile mortared into the wall.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'mood_tile_kind') then
    create type mood_tile_kind as enum ('warm', 'cool', 'spark', 'weight', 'quiet');
  end if;
end $$;

create table if not exists public.reactions (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid not null references public.public_rooms(id) on delete cascade,
  author_user_id  uuid not null references auth.users(id) on delete cascade,
  kind            mood_tile_kind not null,
  wall_face       smallint not null check (wall_face between 0 and 5),
  -- Local UV (0..1) survives room re-position. World coords break under re-layout.
  anchor_u        real not null check (anchor_u between 0 and 1),
  anchor_v        real not null check (anchor_v between 0 and 1),
  created_at      timestamptz not null default now(),
  -- UV-bucket de-dup: one reaction per (author, room, kind, wall_face, ~5% region).
  -- Bucket cells are 20x20 per wall, derived in the unique expression below.
  -- Caps spam: same author can't pile the same tile-kind in the same wall cell.
  unique (
    author_user_id, room_id, kind, wall_face,
    (floor(anchor_u * 20)::int),
    (floor(anchor_v * 20)::int)
  )
);

create index if not exists idx_reactions_room on public.reactions (room_id);
create index if not exists idx_reactions_author on public.reactions (author_user_id);

-- Touch updated_at on plan re-publish so visitors get realtime UPDATE events.
create or replace function public.touch_public_rooms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_public_rooms_touch on public.public_rooms;
create trigger trg_public_rooms_touch
  before update on public.public_rooms
  for each row execute function public.touch_public_rooms_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.public_rooms enable row level security;
alter table public.reactions    enable row level security;

-- Anyone can read rooms marked is_public=true. Private rooms readable only by owner.
drop policy if exists "public_rooms read public" on public.public_rooms;
create policy "public_rooms read public" on public.public_rooms
  for select using (is_public = true or owner_user_id = auth.uid());

-- Owner can insert their own row only.
drop policy if exists "public_rooms insert own" on public.public_rooms;
create policy "public_rooms insert own" on public.public_rooms
  for insert with check (owner_user_id = auth.uid());

-- Owner can update their own row only.
drop policy if exists "public_rooms update own" on public.public_rooms;
create policy "public_rooms update own" on public.public_rooms
  for update using (owner_user_id = auth.uid())
            with check (owner_user_id = auth.uid());

-- Owner can delete their own row only.
drop policy if exists "public_rooms delete own" on public.public_rooms;
create policy "public_rooms delete own" on public.public_rooms
  for delete using (owner_user_id = auth.uid());

-- Reactions readable iff the room is readable (transitively).
drop policy if exists "reactions read where room readable" on public.reactions;
create policy "reactions read where room readable" on public.reactions
  for select using (
    exists (
      select 1 from public.public_rooms r
      where r.id = reactions.room_id
        and (r.is_public = true or r.owner_user_id = auth.uid())
    )
  );

-- Authed users may insert their own reactions ONLY on public rooms.
-- Anonymous writes are blocked because auth.uid() is null for them.
drop policy if exists "reactions insert authed on public" on public.reactions;
create policy "reactions insert authed on public" on public.reactions
  for insert with check (
    author_user_id = auth.uid()
    and exists (
      select 1 from public.public_rooms r
      where r.id = reactions.room_id and r.is_public = true
    )
  );

-- Author may delete own reactions; ROOM OWNER may also delete reactions on their room.
drop policy if exists "reactions delete own or owner" on public.reactions;
create policy "reactions delete own or owner" on public.reactions
  for delete using (
    author_user_id = auth.uid()
    or exists (
      select 1 from public.public_rooms r
      where r.id = reactions.room_id and r.owner_user_id = auth.uid()
    )
  );

-- Realtime publication so subscribeReactions / public_rooms UPDATE events fire.
do $$ begin
  alter publication supabase_realtime add table public.public_rooms;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.reactions;
exception when duplicate_object then null;
end $$;
