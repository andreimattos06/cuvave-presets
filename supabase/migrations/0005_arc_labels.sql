-- Serigrafia curva dos footswitches: no aparelho de verdade o arco traz só o
-- nome do efeito ("REVERB"), sem repetir a letra que já está estampada embaixo
-- do pedal. Tira o prefixo "A / ", "B / "… de qualquer modelo que ainda o tenha.
update public.pedal_models
set config = jsonb_set(
  config,
  '{footswitches}',
  (
    select coalesce(
      jsonb_agg(
        case
          when fs->>'arcLabel' ~ '^[A-Za-z][[:space:]]*/[[:space:]]*'
            then jsonb_set(
              fs,
              '{arcLabel}',
              to_jsonb(
                regexp_replace(fs->>'arcLabel', '^[A-Za-z][[:space:]]*/[[:space:]]*', '')
              )
            )
          else fs
        end
        order by ord
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(config->'footswitches') with ordinality as t(fs, ord)
  )
)
where jsonb_typeof(config->'footswitches') = 'array'
  and exists (
    select 1
    from jsonb_array_elements(config->'footswitches') as fs
    where fs->>'arcLabel' ~ '^[A-Za-z][[:space:]]*/[[:space:]]*'
  );
