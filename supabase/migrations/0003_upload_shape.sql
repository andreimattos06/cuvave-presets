-- Ajusta o modelo ao fluxo real de uso:
--   upload (nome dado pelo autor) → até 10 instrumentos, cada um com UMA
--   pedaleira → até 8 presets daquele instrumento.
-- A pedaleira sai de `presets` e passa para `tracks`: é o instrumento que tem
-- pedaleira, e os presets são as configurações dela ao longo da música.
-- Também acrescenta a contagem de visualizações exibida na lista de envios.

-- ============================================================
-- UPLOADS: nome do envio + visualizações
-- ============================================================
alter table public.uploads add column if not exists title text;
update public.uploads set title = 'Envio de presets' where title is null;
alter table public.uploads alter column title set not null;

alter table public.uploads
  add column if not exists views integer not null default 0;

-- ============================================================
-- TRACKS: a pedaleira do instrumento + teto de 10 por envio
-- ============================================================
alter table public.tracks
  add column if not exists pedal_model_id uuid references public.pedal_models (id);

-- Envios já existentes herdam o modelo do primeiro preset da faixa.
update public.tracks t
set pedal_model_id = p.pedal_model_id
from (
  select distinct on (track_id) track_id, pedal_model_id
  from public.presets
  order by track_id, position
) p
where p.track_id = t.id and t.pedal_model_id is null;

-- Faixa sem preset algum não tem de onde herdar; some junto com o envio órfão.
delete from public.tracks where pedal_model_id is null;

alter table public.tracks alter column pedal_model_id set not null;

create function public.enforce_max_tracks_per_upload()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.tracks where upload_id = new.upload_id) >= 10 then
    raise exception 'Um envio pode ter no máximo 10 instrumentos';
  end if;
  return new;
end;
$$;

create trigger trg_max_tracks_per_upload
  before insert on public.tracks
  for each row execute procedure public.enforce_max_tracks_per_upload();

-- ============================================================
-- PRESETS: a pedaleira agora vem da faixa
-- ============================================================
alter table public.presets drop column if exists pedal_model_id;

-- ============================================================
-- CREATE_UPLOAD: nova forma da árvore (title no envio, pedaleira na faixa)
-- ============================================================
drop function if exists public.create_upload(uuid, text, jsonb);

create function public.create_upload(
  p_song_id uuid,
  p_title text,
  p_note text,
  p_tracks jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_upload_id uuid;
  v_track_id uuid;
  v_track jsonb;
  v_preset jsonb;
  v_track_pos smallint := 0;
  v_preset_pos smallint;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar autenticado para enviar presets';
  end if;

  if jsonb_array_length(p_tracks) = 0 then
    raise exception 'Envie pelo menos um instrumento';
  end if;

  insert into public.uploads (song_id, user_id, title, note)
  values (
    p_song_id,
    auth.uid(),
    btrim(p_title),
    nullif(btrim(coalesce(p_note, '')), '')
  )
  returning id into v_upload_id;

  for v_track in select * from jsonb_array_elements(p_tracks) loop
    insert into public.tracks (upload_id, name, position, pedal_model_id)
    values (
      v_upload_id,
      v_track->>'name',
      v_track_pos,
      (v_track->>'pedal_model_id')::uuid
    )
    returning id into v_track_id;

    v_preset_pos := 0;
    for v_preset in select * from jsonb_array_elements(coalesce(v_track->'presets', '[]'::jsonb)) loop
      insert into public.presets (track_id, name, position, settings)
      values (
        v_track_id,
        v_preset->>'name',
        v_preset_pos,
        coalesce(v_preset->'settings', '{}'::jsonb)
      );
      v_preset_pos := v_preset_pos + 1;
    end loop;

    v_track_pos := v_track_pos + 1;
  end loop;

  return v_upload_id;
end;
$$;

revoke execute on function public.create_upload(uuid, text, text, jsonb) from anon;
grant execute on function public.create_upload(uuid, text, text, jsonb) to authenticated;

-- ============================================================
-- VISUALIZAÇÕES
-- ============================================================
-- Visitante não autenticado também conta, e as policies de `uploads` só deixam
-- o dono escrever: por isso security definer, com escopo mínimo (só o contador).
create function public.increment_upload_views(p_upload_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.uploads
  set views = views + 1
  where id = p_upload_id;
end;
$$;

grant execute on function public.increment_upload_views(uuid) to anon, authenticated;

-- ============================================================
-- BUSCA POR RELEVÂNCIA (banda + música numa lista só)
-- ============================================================
-- Ordena por similaridade trigram, com prioridade para quem começa com o termo.
-- Usa os índices gin_trgm criados na 0001.
create function public.search_catalog(p_query text, p_limit integer default 20)
returns table (
  kind text,
  id uuid,
  title text,
  slug text,
  band_name text,
  band_slug text,
  uploads_count integer,
  relevance real
)
language sql
stable
as $$
  with q as (select btrim(p_query) as term)
  select * from (
    select
      'band'::text as kind,
      b.id,
      b.name as title,
      b.slug,
      b.name as band_name,
      b.slug as band_slug,
      (select count(*) from public.songs s where s.band_id = b.id)::integer as uploads_count,
      (similarity(b.name, q.term) + case when b.name ilike q.term || '%' then 0.3 else 0 end)::real as relevance
    from public.bands b, q
    where b.name ilike '%' || q.term || '%' or similarity(b.name, q.term) > 0.15

    union all

    select
      'song'::text as kind,
      s.id,
      s.title,
      s.slug,
      b.name as band_name,
      b.slug as band_slug,
      (select count(*) from public.uploads u where u.song_id = s.id)::integer as uploads_count,
      (similarity(s.title, q.term) + case when s.title ilike q.term || '%' then 0.3 else 0 end)::real as relevance
    from public.songs s
    join public.bands b on b.id = s.band_id, q
    where s.title ilike '%' || q.term || '%' or similarity(s.title, q.term) > 0.15
  ) results
  order by relevance desc, title
  limit p_limit;
$$;

grant execute on function public.search_catalog(text, integer) to anon, authenticated;
