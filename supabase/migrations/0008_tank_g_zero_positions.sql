-- ============================================================
-- Tank-G: onde o zero existe e onde não existe
-- ============================================================
-- Conferido knob a knob contra o aparelho:
--
--   * IR Cab tem a posição 0 — é o aparelho sem gabinete nenhum;
--   * Noise Gate e os knobs do Amp já podiam zerar (0 = desligado);
--   * Rvb, Dly e Mod Level começam em 1: quem desliga esses blocos é o
--     footswitch, não o knob.
--
-- A 0007 já rodou em produção, então a faixa nova entra por aqui. O JSON
-- completo continua em supabase/seed/0001_pedal_models.sql.

update public.pedal_models m
set config = jsonb_set(
  m.config,
  '{effectBlocks}',
  (
    select jsonb_agg(
      case
        -- IR Cab passa a aceitar a posição 0.
        when block ->> 'id' = 'cab' then jsonb_set(
          block,
          '{params}',
          (
            select jsonb_agg(jsonb_set(param, '{min}', '0'::jsonb) order by pord)
            from jsonb_array_elements(block -> 'params') with ordinality as pp(param, pord)
          )
        )
        -- Level dos blocos de efeito passa a começar em 1.
        when block ->> 'id' in ('reverb', 'delay', 'mod') then jsonb_set(
          block,
          '{params}',
          (
            select jsonb_agg(
              case
                when param ->> 'id' = 'level' then jsonb_set(param, '{min}', '1'::jsonb)
                else param
              end
              order by pord
            )
            from jsonb_array_elements(block -> 'params') with ordinality as pp(param, pord)
          )
        )
        else block
      end
      order by bord
    )
    from jsonb_array_elements(m.config -> 'effectBlocks') with ordinality as bb(block, bord)
  )
)
where m.slug = 'tank-g';

-- Presets gravados antes disso podem ter Level zerado (a 0007 converteu um
-- "Rvb Mix 0" do painel antigo). Sobe para 1, o mínimo do aparelho.
update public.presets p
set settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      p.settings,
      '{blocks,reverb,params,level}',
      to_jsonb(greatest(1, coalesce((p.settings #>> '{blocks,reverb,params,level}')::int, 30)))
    ),
    '{blocks,delay,params,level}',
    to_jsonb(greatest(1, coalesce((p.settings #>> '{blocks,delay,params,level}')::int, 30)))
  ),
  '{blocks,mod,params,level}',
  to_jsonb(greatest(1, coalesce((p.settings #>> '{blocks,mod,params,level}')::int, 30)))
)
from public.tracks t
join public.pedal_models m on m.id = t.pedal_model_id
where t.id = p.track_id
  and m.slug = 'tank-g'
  and p.settings #> '{blocks,reverb,params,level}' is not null;
