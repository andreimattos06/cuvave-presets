-- ============================================================
-- Várias pedaleiras por preset + edição e datas do envio
-- ============================================================
-- Até aqui a pedaleira era do instrumento e o preset guardava um único
-- `settings`. Um mesmo trecho, porém, pode ser descrito em mais de um aparelho:
-- "o solo inicial soa assim na Tank-G e assim na Baby". A configuração passa a
-- morar em `preset_boards`, uma linha por pedaleira dentro do preset, e quem vê
-- o envio escolhe em qual aparelho quer olhar.
--
-- `tracks.pedal_model_id` continua existindo como a pedaleira principal do
-- instrumento — é ela que semeia o primeiro board de cada preset novo.

-- ============================================================
-- PRESET_BOARDS
-- ============================================================
create table if not exists public.preset_boards (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references public.presets (id) on delete cascade,
  pedal_model_id uuid not null references public.pedal_models (id),
  settings jsonb not null default '{}'::jsonb,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  -- A mesma pedaleira duas vezes no mesmo preset seria ambíguo na hora de
  -- mostrar: qual das duas é a configuração boa?
  unique (preset_id, pedal_model_id)
);

alter table public.preset_boards enable row level security;
create index if not exists preset_boards_preset_id_idx on public.preset_boards (preset_id);

create policy "preset_boards_select_public"
  on public.preset_boards for select
  using (true);

create policy "preset_boards_all_owner"
  on public.preset_boards for all
  to authenticated
  using (exists (
    select 1 from public.presets p
    join public.tracks t on t.id = p.track_id
    join public.uploads u on u.id = t.upload_id
    where p.id = preset_id and u.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.presets p
    join public.tracks t on t.id = p.track_id
    join public.uploads u on u.id = t.upload_id
    where p.id = preset_id and u.user_id = auth.uid()
  ));

-- Mesmo teto de 8 KB que `presets.settings` tinha: `settings` é o estado de um
-- painel, não um depósito de dados.
alter table public.preset_boards
  add constraint preset_boards_settings_size
  check (octet_length(settings::text) <= 8192);

alter table public.preset_boards
  add constraint preset_boards_position_range
  check (position >= 0 and position < 4);

create or replace function public.enforce_max_boards_per_preset()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.preset_boards where preset_id = new.preset_id) >= 4 then
    raise exception 'Um preset pode ter no máximo 4 pedaleiras';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_max_boards_per_preset on public.preset_boards;
create trigger trg_max_boards_per_preset
  before insert on public.preset_boards
  for each row execute procedure public.enforce_max_boards_per_preset();

-- Cada preset já gravado vira um board com a pedaleira do instrumento.
insert into public.preset_boards (preset_id, pedal_model_id, settings, position)
select p.id, t.pedal_model_id, p.settings, 0
from public.presets p
join public.tracks t on t.id = p.track_id
on conflict (preset_id, pedal_model_id) do nothing;

-- Duas fontes de verdade para a mesma coisa é pedir para elas divergirem.
alter table public.presets drop column if exists settings;

-- ============================================================
-- DATA DA ÚLTIMA ALTERAÇÃO
-- ============================================================
alter table public.uploads
  add column if not exists updated_at timestamptz not null default now();

-- Envio antigo nunca foi editado: a última alteração é a própria criação.
update public.uploads set updated_at = created_at where updated_at > created_at;

create or replace function public.touch_upload_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_uploads_touch on public.uploads;
create trigger trg_uploads_touch
  before update on public.uploads
  for each row execute procedure public.touch_upload_updated_at();

-- ============================================================
-- O DONO PODE APAGAR O PRÓPRIO ENVIO
-- ============================================================
-- Faltava a policy de delete: tracks, presets, boards e votos saem junto pelas
-- foreign keys `on delete cascade`.
drop policy if exists "uploads_delete_own" on public.uploads;
create policy "uploads_delete_own"
  on public.uploads for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- CREATE_UPLOAD: agora com boards dentro de cada preset
-- ============================================================
create or replace function public.create_upload(
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

  perform public.write_upload_tracks(v_upload_id, p_tracks);
  return v_upload_id;
end;
$$;

-- ============================================================
-- WRITE_UPLOAD_TRACKS: a árvore de instrumentos, usada na criação e na edição
-- ============================================================
create or replace function public.write_upload_tracks(
  p_upload_id uuid,
  p_tracks jsonb
)
returns void
language plpgsql
as $$
declare
  v_track_id uuid;
  v_preset_id uuid;
  v_track jsonb;
  v_preset jsonb;
  v_board jsonb;
  v_track_pos smallint := 0;
  v_preset_pos smallint;
  v_board_pos smallint;
begin
  for v_track in select * from jsonb_array_elements(p_tracks) loop
    insert into public.tracks (upload_id, name, position, pedal_model_id)
    values (
      p_upload_id,
      v_track->>'name',
      v_track_pos,
      (v_track->>'pedal_model_id')::uuid
    )
    returning id into v_track_id;

    v_preset_pos := 0;
    for v_preset in
      select * from jsonb_array_elements(coalesce(v_track->'presets', '[]'::jsonb))
    loop
      insert into public.presets (track_id, name, position)
      values (v_track_id, v_preset->>'name', v_preset_pos)
      returning id into v_preset_id;

      v_board_pos := 0;
      for v_board in
        select * from jsonb_array_elements(coalesce(v_preset->'boards', '[]'::jsonb))
      loop
        insert into public.preset_boards (preset_id, pedal_model_id, settings, position)
        values (
          v_preset_id,
          (v_board->>'pedal_model_id')::uuid,
          coalesce(v_board->'settings', '{}'::jsonb),
          v_board_pos
        );
        v_board_pos := v_board_pos + 1;
      end loop;

      if v_board_pos = 0 then
        raise exception 'Cada preset precisa de pelo menos uma pedaleira';
      end if;

      v_preset_pos := v_preset_pos + 1;
    end loop;

    v_track_pos := v_track_pos + 1;
  end loop;
end;
$$;

-- ============================================================
-- UPDATE_UPLOAD: reescreve a árvore de um envio que já existe
-- ============================================================
-- Trocar instrumento por instrumento daria um diff grande e cheio de casos de
-- borda; o formulário já manda a árvore inteira, então a edição apaga e
-- regrava. Votos e visualizações ficam em `uploads` e sobrevivem.
create or replace function public.update_upload(
  p_upload_id uuid,
  p_title text,
  p_note text,
  p_tracks jsonb
)
returns uuid
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'É preciso estar autenticado para editar presets';
  end if;

  if not exists (
    select 1 from public.uploads
    where id = p_upload_id and user_id = auth.uid()
  ) then
    raise exception 'Envio não encontrado';
  end if;

  if jsonb_array_length(p_tracks) = 0 then
    raise exception 'Envie pelo menos um instrumento';
  end if;

  update public.uploads
  set title = btrim(p_title),
      note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_upload_id;

  -- Presets e boards saem em cascata junto com as faixas.
  delete from public.tracks where upload_id = p_upload_id;

  perform public.write_upload_tracks(p_upload_id, p_tracks);
  return p_upload_id;
end;
$$;

revoke execute on function public.write_upload_tracks(uuid, jsonb) from anon;
revoke execute on function public.update_upload(uuid, text, text, jsonb) from anon;
grant execute on function public.update_upload(uuid, text, text, jsonb) to authenticated;
