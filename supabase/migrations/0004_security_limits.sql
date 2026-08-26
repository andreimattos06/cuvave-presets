-- Endurecimento do backend: tetos de tamanho em toda entrada de usuário e um
-- balde de rate limit compartilhado pelo servidor.
--
-- O zod das server actions já barra o grosso, mas o PostgREST fica exposto com
-- a anon key: qualquer cliente pode inserir direto nas tabelas com RLS de
-- escrita própria (bands, songs, votes…). Os checks abaixo são a última linha.

-- ============================================================
-- TETOS DE TAMANHO
-- ============================================================
-- Os dados já gravados vieram do formulário, que sempre teve limites — ainda
-- assim as constraints entram como `not valid` para nunca travar a migração num
-- registro legado; elas valem para todo insert/update daqui em diante.

alter table public.profiles
  add constraint profiles_username_shape
  check (char_length(username) between 3 and 24 and username ~ '^[A-Za-z0-9_-]+$')
  not valid;

alter table public.bands
  add constraint bands_name_len check (char_length(name) between 1 and 80) not valid,
  add constraint bands_slug_len check (char_length(slug) between 1 and 120) not valid,
  add constraint bands_cover_url_len check (cover_url is null or char_length(cover_url) <= 500) not valid;

alter table public.songs
  add constraint songs_title_len check (char_length(title) between 1 and 120) not valid,
  add constraint songs_slug_len check (char_length(slug) between 1 and 160) not valid;

alter table public.uploads
  add constraint uploads_title_len check (char_length(title) between 3 and 80) not valid,
  add constraint uploads_note_len check (note is null or char_length(note) <= 400) not valid,
  add constraint uploads_views_positive check (views >= 0) not valid;

alter table public.tracks
  add constraint tracks_name_len check (char_length(name) between 1 and 60) not valid,
  add constraint tracks_position_range check (position >= 0 and position < 10) not valid;

-- 8 KB por preset dá folga larga para o maior painel (Tank-G, 15 knobs ≈ 700 B)
-- e ainda assim impede que alguém use `settings` como depósito de dados.
alter table public.presets
  add constraint presets_name_len check (char_length(name) between 1 and 40) not valid,
  add constraint presets_settings_size check (octet_length(settings::text) <= 8192) not valid;

-- ============================================================
-- USERNAME GERADO NO CADASTRO
-- ============================================================
-- Correção junto com a constraint acima: o regexp antigo rodava antes do lower,
-- então "Andrei Mattos" virava "-ndrei--attos", e nomes longos passavam dos 24
-- caracteres agora exigidos.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := regexp_replace(
    lower(coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )),
    '[^a-z0-9]+', '-', 'g'
  );
  base_username := btrim(base_username, '-');
  -- Deixa espaço para o sufixo de desempate dentro do teto de 24.
  base_username := left(base_username, 20);

  if char_length(base_username) < 3 then
    base_username := 'musico';
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '-' || suffix;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, final_username, left(new.raw_user_meta_data->>'avatar_url', 500));

  return new;
end;
$$;

-- ============================================================
-- RATE LIMIT
-- ============================================================
-- Contador por janela deslizante, no banco (e não em memória do processo)
-- porque cada instância serverless do Next tem a sua própria memória.
-- `bucket` é um hash com salt do servidor: quem só tem a anon key não consegue
-- adivinhar o balde de outra pessoa para estourá-lo.
create table if not exists public.rate_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

alter table public.rate_limits enable row level security;
-- Sem policy alguma: nem anon nem authenticated leem ou escrevem direto.
-- O acesso é exclusivamente pela função security definer abaixo.

create index if not exists rate_limits_window_start_idx
  on public.rate_limits (window_start);

-- Retorna 0 quando a chamada é permitida, ou os segundos que faltam para a
-- janela virar. Consumir e decidir na mesma instrução evita corrida.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window interval;
  v_hits integer;
  v_start timestamptz;
begin
  if p_bucket is null or char_length(p_bucket) < 8
     or p_limit is null or p_limit < 1
     or p_window_seconds is null or p_window_seconds < 1 then
    return 0;
  end if;

  v_window := make_interval(secs => least(p_window_seconds, 86400));

  insert into public.rate_limits as r (bucket, window_start, hits)
  values (left(p_bucket, 128), v_now, 1)
  on conflict (bucket) do update
    set hits = case when r.window_start < v_now - v_window then 1 else r.hits + 1 end,
        window_start = case when r.window_start < v_now - v_window then v_now else r.window_start end
  returning r.hits, r.window_start into v_hits, v_start;

  -- Faxina amortizada: sem isso a tabela só cresce.
  if random() < 0.005 then
    delete from public.rate_limits where window_start < v_now - interval '1 day';
  end if;

  if v_hits > p_limit then
    return greatest(1, ceil(extract(epoch from (v_start + v_window) - v_now))::integer);
  end if;

  return 0;
end;
$$;

grant execute on function public.consume_rate_limit(text, integer, integer)
  to anon, authenticated;
