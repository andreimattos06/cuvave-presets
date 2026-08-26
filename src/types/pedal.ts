/** Descreve um parâmetro contínuo (knob) de um bloco de efeito ou controle global. */
export type KnobParam = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
};

/** Um bloco de efeito (Compressor, Drive, Amp, Mod, Delay, Reverb, etc.). */
export type EffectBlockConfig = {
  id: string;
  label: string;
  /** Referencia uma cor neon definida em globals.css (ex.: "neon-violet"). */
  color: string;
  params: KnobParam[];
};

export type FootswitchConfig = {
  id: string;
  /** Marcação sob o pedal — nas M-Vave costuma ser só a letra: A, B, C, D. */
  label: string;
  /** Quando definido, o footswitch liga/desliga (bypass) esse bloco de efeito. */
  togglesBlockId?: string;
  /** Texto da serigrafia curva acima do pedal; se ausente, usa o nome do bloco. */
  arcLabel?: string;
};

/** Config data-driven de um modelo de pedaleira — vem de pedal_models.config (jsonb). */
export type PedalModelConfig = {
  chassisColor: string;
  screenStyle: "lcd-mono" | "lcd-color";
  hasExpressionPedal: boolean;
  globalKnobs: KnobParam[];
  effectBlocks: EffectBlockConfig[];
  footswitches: FootswitchConfig[];
  /** Serigrafia da marca no canto do chassis. */
  brand?: string;
  /** Acabamento do metal: preto fosco (Baby) ou pintura metálica (Tank-G). */
  chassisFinish?: "matte" | "metallic";
  /** Display de 7 segmentos vermelho, como no Tank-G. */
  hasSevenSegment?: boolean;
  /** Cor dos LEDs dos knobs globais (os blocos usam a cor do próprio bloco). */
  globalLedColor?: string;
};

export type PedalModel = {
  id: string;
  name: string;
  slug: string;
  config: PedalModelConfig;
};

/** Estado de um bloco de efeito dentro de um preset específico. */
export type BlockSettings = {
  enabled: boolean;
  params: Record<string, number>;
};

/** Valor salvo em presets.settings (jsonb) — o "estado" da pedaleira virtual. */
export type PresetSettings = {
  blocks: Record<string, BlockSettings>;
  globalKnobs: Record<string, number>;
};

export function createDefaultPresetSettings(
  config: PedalModelConfig,
): PresetSettings {
  const blocks: Record<string, BlockSettings> = {};
  for (const block of config.effectBlocks) {
    blocks[block.id] = {
      enabled: true,
      params: Object.fromEntries(
        block.params.map((p) => [p.id, p.default]),
      ),
    };
  }

  const globalKnobs = Object.fromEntries(
    config.globalKnobs.map((p) => [p.id, p.default]),
  );

  return { blocks, globalKnobs };
}

/**
 * Knob de posições fixas — nas M-Vave, IR Cab e Type não varrem valores: são
 * chaves que andam de uma posição para a outra (1, 2, 3… 9).
 */
export function isSteppedParam(param: KnobParam) {
  return param.step >= 1;
}

/** Texto do valor como o aparelho mostra: inteiro nas chaves, 1 casa nos demais. */
export function formatParamValue(param: KnobParam, value: number) {
  return isSteppedParam(param) ? String(Math.round(value)) : value.toFixed(1);
}

/**
 * Devolve um PresetSettings que só contém o que o painel daquele modelo aceita:
 * blocos e knobs desconhecidos somem, e todo valor é grudado no passo e preso
 * entre min e max. Roda no servidor antes de gravar — sem isso, um cliente
 * forjado poderia guardar qualquer JSON (ou valores fora de escala) em
 * `presets.settings`.
 */
export function sanitizePresetSettings(
  config: PedalModelConfig,
  raw: PresetSettings,
): PresetSettings {
  function normalize(param: KnobParam, value: unknown) {
    const numeric =
      typeof value === "number" && Number.isFinite(value) ? value : param.default;
    const stepped =
      Math.round((numeric - param.min) / param.step) * param.step + param.min;
    const clamped = Math.min(param.max, Math.max(param.min, stepped));
    return Math.round(clamped * 1000) / 1000;
  }

  const blocks: Record<string, BlockSettings> = {};
  for (const block of config.effectBlocks) {
    const incoming = raw?.blocks?.[block.id];
    blocks[block.id] = {
      enabled: typeof incoming?.enabled === "boolean" ? incoming.enabled : true,
      params: Object.fromEntries(
        block.params.map((p) => [p.id, normalize(p, incoming?.params?.[p.id])]),
      ),
    };
  }

  const globalKnobs = Object.fromEntries(
    config.globalKnobs.map((k) => [k.id, normalize(k, raw?.globalKnobs?.[k.id])]),
  );

  return { blocks, globalKnobs };
}
