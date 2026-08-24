-- Envio de presets é uma operação de árvore (upload → tracks → presets).
-- Fazer isso em três round-trips do PostgREST deixaria uploads órfãos se algo
-- falhasse no meio. Uma função roda em transação única e continua sujeita às
-- policies de RLS (security invoker é o padrão).

create function public.create_upload(
  p_song_id uuid,
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
    raise exception 'Envie pelo menos uma faixa';
  end if;

  insert into public.uploads (song_id, user_id, note)
  values (p_song_id, auth.uid(), nullif(btrim(coalesce(p_note, '')), ''))
  returning id into v_upload_id;

  for v_track in select * from jsonb_array_elements(p_tracks) loop
    insert into public.tracks (upload_id, name, position)
    values (v_upload_id, v_track->>'name', v_track_pos)
    returning id into v_track_id;

    v_preset_pos := 0;
    for v_preset in select * from jsonb_array_elements(coalesce(v_track->'presets', '[]'::jsonb)) loop
      insert into public.presets (track_id, pedal_model_id, name, position, settings)
      values (
        v_track_id,
        (v_preset->>'pedal_model_id')::uuid,
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

revoke execute on function public.create_upload(uuid, text, jsonb) from anon;
grant execute on function public.create_upload(uuid, text, jsonb) to authenticated;
