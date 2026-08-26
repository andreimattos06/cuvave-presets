-- M-Vave Music Presets — schema inicial
-- Convenções: RLS habilitado em toda tabela pública; leitura é sempre pública,
-- escrita exige auth.uid() e, quando aplicável, posse do recurso pai.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cria automaticamente um profile ao registrar um novo usuário (email/senha ou Google)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_username := trim(both '-' from base_username);
  if base_username = '' then
    base_username := 'musico';
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '-' || suffix;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, final_username, new.raw_user_meta_data->>'avatar_url');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PEDAL MODELS (catálogo de pedaleiras — somente leitura pública)
-- ============================================================
create table public.pedal_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  config jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.pedal_models enable row level security;

create policy "pedal_models_select_public"
  on public.pedal_models for select
  using (true);
-- Sem política de insert/update/delete: gerenciado via seed/service role.

-- ============================================================
-- BANDS
-- ============================================================
create table public.bands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  cover_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.bands enable row level security;
create index bands_name_trgm_idx on public.bands using gin (name gin_trgm_ops);

create policy "bands_select_public"
  on public.bands for select
  using (true);

create policy "bands_insert_authenticated"
  on public.bands for insert
  to authenticated
  with check (auth.uid() = created_by);

-- ============================================================
-- SONGS
-- ============================================================
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  title text not null,
  slug text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (band_id, slug)
);

alter table public.songs enable row level security;
create index songs_band_id_idx on public.songs (band_id);
create index songs_title_trgm_idx on public.songs using gin (title gin_trgm_ops);

create policy "songs_select_public"
  on public.songs for select
  using (true);

create policy "songs_insert_authenticated"
  on public.songs for insert
  to authenticated
  with check (auth.uid() = created_by);

-- ============================================================
-- UPLOADS (um conjunto de presets enviado por um usuário para uma música)
-- ============================================================
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table public.uploads enable row level security;
create index uploads_song_id_idx on public.uploads (song_id);
create index uploads_user_id_idx on public.uploads (user_id);

create policy "uploads_select_public"
  on public.uploads for select
  using (true);

create policy "uploads_insert_own"
  on public.uploads for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "uploads_update_own"
  on public.uploads for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "uploads_delete_own"
  on public.uploads for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- TRACKS (ex.: "Guitarra Principal", nome livre definido pelo usuário)
-- ============================================================
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads (id) on delete cascade,
  name text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tracks enable row level security;
create index tracks_upload_id_idx on public.tracks (upload_id);

create policy "tracks_select_public"
  on public.tracks for select
  using (true);

create policy "tracks_all_owner"
  on public.tracks for all
  to authenticated
  using (exists (
    select 1 from public.uploads u where u.id = upload_id and u.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.uploads u where u.id = upload_id and u.user_id = auth.uid()
  ));

-- ============================================================
-- PRESETS (até 8 por track, cada um com um modelo de pedaleira + settings)
-- ============================================================
create table public.presets (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  pedal_model_id uuid not null references public.pedal_models (id),
  name text not null,
  position smallint not null default 0 check (position >= 0 and position < 8),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.presets enable row level security;
create index presets_track_id_idx on public.presets (track_id);

create policy "presets_select_public"
  on public.presets for select
  using (true);

create policy "presets_all_owner"
  on public.presets for all
  to authenticated
  using (exists (
    select 1 from public.tracks t
    join public.uploads u on u.id = t.upload_id
    where t.id = track_id and u.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.tracks t
    join public.uploads u on u.id = t.upload_id
    where t.id = track_id and u.user_id = auth.uid()
  ));

-- Reforça o limite de 8 presets por track mesmo em concorrência
create function public.enforce_max_presets_per_track()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.presets where track_id = new.track_id) >= 8 then
    raise exception 'Uma faixa pode ter no máximo 8 presets';
  end if;
  return new;
end;
$$;

create trigger trg_max_presets_per_track
  before insert on public.presets
  for each row execute procedure public.enforce_max_presets_per_track();

-- ============================================================
-- VOTES (aprovar = 1, reprovar = -1; um voto por usuário por upload)
-- ============================================================
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  unique (upload_id, user_id)
);

alter table public.votes enable row level security;
create index votes_upload_id_idx on public.votes (upload_id);

create policy "votes_select_public"
  on public.votes for select
  using (true);

create policy "votes_all_own"
  on public.votes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Score agregado por upload, usado para ordenar uploads de uma mesma música
create view public.upload_scores as
select
  upload_id,
  coalesce(sum(value), 0)::int as score,
  count(*) filter (where value = 1)::int as approvals,
  count(*) filter (where value = -1)::int as disapprovals
from public.votes
group by upload_id;

-- ============================================================
-- STORAGE (capas de banda/música)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "covers_select_public"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "covers_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'covers');

create policy "covers_update_owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'covers' and owner = auth.uid());

create policy "covers_delete_owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'covers' and owner = auth.uid());
