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
  /** Marcação sob o pedal — nas Cuvave costuma ser só a letra: A, B, C, D. */
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
