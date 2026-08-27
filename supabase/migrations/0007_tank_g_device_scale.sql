-- ============================================================
-- Tank-G: painel do site alinhado ao aparelho
-- ============================================================
-- O arquivo .tkg do app oficial mostrou como a pedaleira guarda um preset (ver
-- o mapa comentado em src/lib/mvave/tkg.ts):
--
--   * cada parâmetro anda de 0 a 100, e não de 0 a 10 como os outros modelos;
--   * Mod, Delay e Reverb têm um seletor de tipo além do nível — o painel antigo
--     inventava dois knobs contínuos ("Rvb Mix"/"Rvb Decay") que não existem lá.
--
-- Esta migration republica a config da Tank-G nessa escala e converte os presets
-- que já estavam gravados no formato antigo, para eles não virarem timbres
-- mudos (gain 6 de 99) ao abrir no painel novo.
--
-- O mesmo JSON vive em supabase/seed/0001_pedal_models.sql e em
-- src/components/pedalboard/demo-models.ts — os três andam juntos.

-- ── 1. painel ───────────────────────────────────────────────
update public.pedal_models
set config = $json${
  "brand": "M-VAVE",
  "chassisColor": "#4fbfae",
  "chassisFinish": "metallic",
  "screenStyle": "lcd-mono",
  "hasSevenSegment": true,
  "hasExpressionPedal": false,
  "globalLedColor": "neon-white",
  "globalKnobs": [
    { "id": "master", "label": "Master", "min": 0, "max": 100, "step": 1, "default": 70 }
  ],
  "effectBlocks": [
    { "id": "cab", "label": "IR Cab", "color": "neon-amber", "params": [
      { "id": "ir", "label": "IR Cab", "min": 0, "max": 9, "step": 1, "default": 1 }
    ]},
    { "id": "reverb", "label": "Reverb", "color": "neon-violet", "params": [
      { "id": "type", "label": "Rvb Type", "min": 1, "max": 100, "step": 1, "default": 1 },
      { "id": "level", "label": "Rvb Level", "min": 1, "max": 100, "step": 1, "default": 30 }
    ]},
    { "id": "delay", "label": "Delay", "color": "neon-blue", "params": [
      { "id": "type", "label": "Dly Type", "min": 1, "max": 100, "step": 1, "default": 1 },
      { "id": "level", "label": "Dly Level", "min": 1, "max": 100, "step": 1, "default": 30 }
    ]},
    { "id": "mod", "label": "Mod", "color": "neon-emerald", "params": [
      { "id": "type", "label": "Mod Type", "min": 1, "max": 100, "step": 1, "default": 1 },
      { "id": "level", "label": "Mod Level", "min": 1, "max": 100, "step": 1, "default": 30 }
    ]},
    { "id": "amp", "label": "Amp", "color": "neon-red", "params": [
      { "id": "type", "label": "Type", "min": 1, "max": 9, "step": 1, "default": 1 },
      { "id": "gain", "label": "Gain", "min": 0, "max": 100, "step": 1, "default": 60 },
      { "id": "treble", "label": "Treble", "min": 0, "max": 100, "step": 1, "default": 50 },
      { "id": "middle", "label": "Middle", "min": 0, "max": 100, "step": 1, "default": 50 },
      { "id": "bass", "label": "Bass", "min": 0, "max": 100, "step": 1, "default": 50 },
      { "id": "volume", "label": "Volume", "min": 0, "max": 100, "step": 1, "default": 60 }
    ]},
    { "id": "gate", "label": "Noise Gate", "color": "neon-white", "params": [
      { "id": "depth", "label": "Gate", "min": 0, "max": 100, "step": 1, "default": 30 }
    ]}
  ],
  "footswitches": [
    { "id": "fs-a", "label": "A", "togglesBlockId": "reverb", "arcLabel": "Reverb" },
    { "id": "fs-b", "label": "B", "togglesBlockId": "delay", "arcLabel": "Delay" },
    { "id": "fs-c", "label": "C", "togglesBlockId": "mod", "arcLabel": "Mod" },
    { "id": "fs-d", "label": "D", "togglesBlockId": "amp", "arcLabel": "Amp" }
  ]
}$json$::jsonb
where slug = 'tank-g';

-- ── 2. presets já gravados ──────────────────────────────
-- Knob contínuo antigo (0–10) vira o mesmo ponto na escala do aparelho (0–100).
create function pg_temp.tkg_level(v jsonb, fallback int) returns int
  language sql immutable as $fn$
  select case
    when v is null or jsonb_typeof(v) <> 'number' then fallback
    else least(100, greatest(0, round(((v #>> '{}')::numeric) * 10)))::int
  end
$fn$;

-- Chave de 9 posições (IR Cab, Amp Type): o número já era o número. Alguns
-- presets de teste têm 0 ou 10 gravados, de antes do painel prender a faixa.
create function pg_temp.tkg_sel(v jsonb, fallback int) returns int
  language sql immutable as $fn$
  select case
    when v is null or jsonb_typeof(v) <> 'number' then fallback
    else least(9, greatest(1, round((v #>> '{}')::numeric)))::int
  end
$fn$;

create function pg_temp.tkg_on(b jsonb) returns boolean
  language sql immutable as $fn$
  select coalesce((b ->> 'enabled')::boolean, true)
$fn$;

-- O painel antigo trocou de nomes no meio do caminho (mod.rate virou mod.speed,
-- delay perdeu o fb): pega o primeiro que existir.
create function pg_temp.tkg_first(variadic vs jsonb[]) returns jsonb
  language sql immutable as $fn$
  select v from unnest(vs) as v where v is not null and jsonb_typeof(v) = 'number' limit 1
$fn$;

update public.presets p
set settings = jsonb_build_object(
  'globalKnobs', jsonb_build_object(
    'master', pg_temp.tkg_level(p.settings #> '{globalKnobs,master}', 70)
  ),
  'blocks', jsonb_build_object(
    'cab', jsonb_build_object(
      'enabled', pg_temp.tkg_on(p.settings #> '{blocks,cab}'),
      'params', jsonb_build_object(
        'ir', pg_temp.tkg_sel(p.settings #> '{blocks,cab,params,ir}', 1)
      )
    ),
    -- Sem tipo escolhido no formato antigo: entra na primeira posição, e o
    -- nível herda o knob que dosava o efeito.
    'reverb', jsonb_build_object(
      'enabled', pg_temp.tkg_on(p.settings #> '{blocks,reverb}'),
      'params', jsonb_build_object(
        'type', 1,
        'level', pg_temp.tkg_level(p.settings #> '{blocks,reverb,params,mix}', 30)
      )
    ),
    'delay', jsonb_build_object(
      'enabled', pg_temp.tkg_on(p.settings #> '{blocks,delay}'),
      'params', jsonb_build_object(
        'type', 1,
        'level', pg_temp.tkg_level(p.settings #> '{blocks,delay,params,mix}', 30)
      )
    ),
    'mod', jsonb_build_object(
      'enabled', pg_temp.tkg_on(p.settings #> '{blocks,mod}'),
      'params', jsonb_build_object(
        'type', 1,
        'level', pg_temp.tkg_level(
          pg_temp.tkg_first(
            p.settings #> '{blocks,mod,params,speed}',
            p.settings #> '{blocks,mod,params,rate}'
          ),
          30
        )
      )
    ),
    'amp', jsonb_build_object(
      'enabled', pg_temp.tkg_on(p.settings #> '{blocks,amp}'),
      'params', jsonb_build_object(
        'type', pg_temp.tkg_sel(p.settings #> '{blocks,amp,params,type}', 1),
        'gain', pg_temp.tkg_level(p.settings #> '{blocks,amp,params,gain}', 60),
        'treble', pg_temp.tkg_level(p.settings #> '{blocks,amp,params,treble}', 50),
        'middle', pg_temp.tkg_level(p.settings #> '{blocks,amp,params,middle}', 50),
        'bass', pg_temp.tkg_level(p.settings #> '{blocks,amp,params,bass}', 50),
        'volume', pg_temp.tkg_level(p.settings #> '{blocks,amp,params,volume}', 60)
      )
    ),
    'gate', jsonb_build_object(
      'enabled', pg_temp.tkg_on(p.settings #> '{blocks,gate}'),
      'params', jsonb_build_object(
        'depth', pg_temp.tkg_level(p.settings #> '{blocks,gate,params,depth}', 30)
      )
    )
  )
)
from public.tracks t
join public.pedal_models m on m.id = t.pedal_model_id
where t.id = p.track_id
  and m.slug = 'tank-g'
  -- Idempotente: quem já está no formato novo tem "level" no Reverb e fica fora.
  and p.settings #> '{blocks,reverb,params,level}' is null;
