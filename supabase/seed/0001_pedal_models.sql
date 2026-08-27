-- Catálogo inicial de pedaleiras M-Vave. Estrutura data-driven consumida por
-- <PedalBoard>; os painéis reproduzem o painel dos aparelhos reais.
-- Mantenha em sincronia com src/components/pedalboard/demo-models.ts.
-- Rode manualmente (SQL editor do Supabase ou `supabase db execute`) após as
-- migrations, de preferência com a service role. Pode ser rodado quantas vezes
-- for preciso: o upsert por slug atualiza o painel de quem já está no banco.

insert into public.pedal_models (name, slug, config) values
(
  'M-Vave Baby',
  'baby',
  $json${
    "brand": "M-VAVE",
    "chassisColor": "#17171a",
    "chassisFinish": "matte",
    "screenStyle": "lcd-mono",
    "hasSevenSegment": false,
    "hasExpressionPedal": false,
    "globalLedColor": "neon-violet",
    "globalKnobs": [
      { "id": "volume", "label": "Volume", "min": 0, "max": 10, "step": 0.1, "default": 7 }
    ],
    "effectBlocks": [
      { "id": "cab", "label": "IR Cab", "color": "neon-green", "params": [
        { "id": "ir", "label": "IR Cab", "min": 0, "max": 10, "step": 0.1, "default": 5 }
      ]},
      { "id": "reverb", "label": "Reverb", "color": "neon-green", "params": [
        { "id": "reverb", "label": "Reverb", "min": 0, "max": 10, "step": 0.1, "default": 4 }
      ]},
      { "id": "delay", "label": "Delay", "color": "neon-cyan", "params": [
        { "id": "mix", "label": "Mix", "min": 0, "max": 10, "step": 0.1, "default": 3 },
        { "id": "fb", "label": "FB", "min": 0, "max": 10, "step": 0.1, "default": 3 },
        { "id": "time", "label": "Time", "min": 0, "max": 10, "step": 0.1, "default": 4 }
      ]},
      { "id": "mod", "label": "Mod", "color": "neon-cyan", "params": [
        { "id": "mod", "label": "Mod", "min": 0, "max": 10, "step": 0.1, "default": 3 }
      ]},
      { "id": "amp", "label": "Amp", "color": "neon-rose", "params": [
        { "id": "tone", "label": "Tone", "min": 0, "max": 10, "step": 0.1, "default": 5 },
        { "id": "gain", "label": "Gain", "min": 0, "max": 10, "step": 0.1, "default": 6 },
        { "id": "type", "label": "Type", "min": 0, "max": 10, "step": 0.1, "default": 2 }
      ]}
    ],
    "footswitches": [
      { "id": "fs-a", "label": "A", "togglesBlockId": "reverb", "arcLabel": "IR Cab · Reverb" },
      { "id": "fs-b", "label": "B", "togglesBlockId": "delay", "arcLabel": "Delay · Mod" },
      { "id": "fs-c", "label": "C", "togglesBlockId": "amp", "arcLabel": "Tone · Amp" }
    ]
  }$json$::jsonb
),
(
  'M-Vave Tank-G',
  'tank-g',
  $json${
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
),
(
  'M-Vave Papa Blues',
  'papa-blues',
  $json${
    "brand": "M-VAVE",
    "chassisColor": "#c9a227",
    "chassisFinish": "metallic",
    "screenStyle": "lcd-mono",
    "hasSevenSegment": false,
    "hasExpressionPedal": true,
    "globalLedColor": "neon-amber",
    "globalKnobs": [
      { "id": "volume", "label": "Volume", "min": 0, "max": 10, "step": 0.1, "default": 6 },
      { "id": "expression", "label": "Expressão", "min": 0, "max": 10, "step": 0.1, "default": 0 }
    ],
    "effectBlocks": [
      { "id": "overdrive", "label": "Overdrive", "color": "neon-amber", "params": [
        { "id": "drive", "label": "Drive", "min": 0, "max": 10, "step": 0.1, "default": 5 },
        { "id": "tone", "label": "Tone", "min": 0, "max": 10, "step": 0.1, "default": 5 },
        { "id": "level", "label": "Level", "min": 0, "max": 10, "step": 0.1, "default": 6 }
      ]}
    ],
    "footswitches": [
      { "id": "fs-on", "label": "ON", "togglesBlockId": "overdrive" }
    ]
  }$json$::jsonb
)
-- Idempotente: rodar de novo republica os painéis já cadastrados.
on conflict (slug) do update
  set name = excluded.name,
      config = excluded.config;
