-- ============================================================
-- Cotas diárias de criação
-- ============================================================
-- O rate limit das server actions (0004) só vale para quem passa pelo site.
-- As policies de insert de bands, songs e uploads liberam qualquer usuário
-- autenticado, e a anon key é pública: dá para falar com o PostgREST direto e
-- despejar linhas sem nunca tocar no Next. As cotas abaixo ficam no banco, que
-- é o único ponto por onde toda escrita passa.
--
-- Os números são folgados para quem cataloga de verdade (uma banda nova por
-- envio, várias músicas na sequência) e apertados o bastante para que uma conta
-- sozinha não consiga encher a tabela.

-- Contagem por autor na janela de 24 h: sem estes índices o trigger vira um
-- seq scan a cada insert.
create index if not exists bands_created_by_at_idx
  on public.bands (created_by, created_at desc);
create index if not exists songs_created_by_at_idx
  on public.songs (created_by, created_at desc);
create index if not exists uploads_user_id_at_idx
  on public.uploads (user_id, created_at desc);

-- 54000 = program_limit_exceeded. As server actions olham esse código para
-- distinguir "bateu na cota" de um erro qualquer de escrita.
create or replace function public.enforce_bands_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if new.created_by is null then
    return new;
  end if;
  select count(*) into v_count
    from public.bands
   where created_by = new.created_by
     and created_at > now() - interval '24 hours';
  if v_count >= 20 then
    raise exception 'cota diaria de bandas atingida' using errcode = '54000';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_songs_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if new.created_by is null then
    return new;
  end if;
  select count(*) into v_count
    from public.songs
   where created_by = new.created_by
     and created_at > now() - interval '24 hours';
  if v_count >= 60 then
    raise exception 'cota diaria de musicas atingida' using errcode = '54000';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_uploads_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
    from public.uploads
   where user_id = new.user_id
     and created_at > now() - interval '24 hours';
  if v_count >= 30 then
    raise exception 'cota diaria de envios atingida' using errcode = '54000';
  end if;
  return new;
end;
$$;

drop trigger if exists bands_quota_trg on public.bands;
create trigger bands_quota_trg
  before insert on public.bands
  for each row execute function public.enforce_bands_quota();

drop trigger if exists songs_quota_trg on public.songs;
create trigger songs_quota_trg
  before insert on public.songs
  for each row execute function public.enforce_songs_quota();

drop trigger if exists uploads_quota_trg on public.uploads;
create trigger uploads_quota_trg
  before insert on public.uploads
  for each row execute function public.enforce_uploads_quota();

-- ============================================================
-- TETOS DE TAMANHO QUE FALTAVAM
-- ============================================================
-- A 0004 cobriu bands, songs, uploads, tracks e presets. Sobrou o avatar do
-- perfil, que o usuário pode trocar por update direto.
alter table public.profiles
  add constraint profiles_avatar_url_len
  check (avatar_url is null or char_length(avatar_url) <= 500)
  not valid;
