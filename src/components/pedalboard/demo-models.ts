import type { PedalModel } from "@/types/pedal";

/**
 * Espelha supabase/seed/0001_pedal_models.sql — mantidos em sincronia à mão
 * para a página de demo funcionar sem banco configurado.
 * Painéis baseados nas fotos dos aparelhos reais.
 */
const k = (id: string, label: string, def: number) => ({
  id,
  label,
  min: 0,
  max: 10,
  step: 0.1,
  default: def,
});

/** Chave de 9 posições (IR Cab, Type): anda de um em um, sem valores quebrados. */
const sw = (id: string, label: string, def: number) => ({
  id,
  label,
  min: 1,
  max: 9,
  step: 1,
  default: def,
});

export const DEMO_MODELS: PedalModel[] = [
  {
    id: "demo-baby",
    name: "M-Vave Baby",
    slug: "baby",
    config: {
      brand: "M-VAVE",
      chassisColor: "#17171a",
      chassisFinish: "matte",
      screenStyle: "lcd-mono",
      hasSevenSegment: false,
      hasExpressionPedal: false,
      globalLedColor: "neon-violet",
      globalKnobs: [k("volume", "Volume", 7)],
      effectBlocks: [
        {
          id: "cab",
          label: "IR Cab",
          color: "neon-green",
          params: [k("ir", "IR Cab", 5)],
        },
        {
          id: "reverb",
          label: "Reverb",
          color: "neon-green",
          params: [k("reverb", "Reverb", 4)],
        },
        {
          id: "delay",
          label: "Delay",
          color: "neon-cyan",
          params: [k("mix", "Mix", 3), k("fb", "FB", 3), k("time", "Time", 4)],
        },
        {
          id: "mod",
          label: "Mod",
          color: "neon-cyan",
          params: [k("mod", "Mod", 3)],
        },
        {
          id: "amp",
          label: "Amp",
          color: "neon-rose",
          params: [k("tone", "Tone", 5), k("gain", "Gain", 6), k("type", "Type", 2)],
        },
      ],
      footswitches: [
        { id: "fs-a", label: "A", togglesBlockId: "reverb", arcLabel: "IR Cab · Reverb" },
        { id: "fs-b", label: "B", togglesBlockId: "delay", arcLabel: "Delay · Mod" },
        { id: "fs-c", label: "C", togglesBlockId: "amp", arcLabel: "Tone · Amp" },
      ],
    },
  },
  {
    id: "demo-tank-g",
    name: "M-Vave Tank-G",
    slug: "tank-g",
    config: {
      brand: "M-VAVE",
      chassisColor: "#4fbfae",
      chassisFinish: "metallic",
      screenStyle: "lcd-mono",
      hasSevenSegment: true,
      hasExpressionPedal: false,
      globalLedColor: "neon-white",
      // Ordem da serigrafia do aparelho: Master, IR Cab, Reverb, Delay, Mod,
      // Amp e Noise Gate.
      globalKnobs: [k("master", "Master", 7)],
      effectBlocks: [
        {
          id: "cab",
          label: "IR Cab",
          color: "neon-amber",
          params: [sw("ir", "IR Cab", 1)],
        },
        {
          id: "reverb",
          label: "Reverb",
          color: "neon-violet",
          params: [k("mix", "Rvb Mix", 3), k("decay", "Rvb Decay", 4)],
        },
        {
          id: "delay",
          label: "Delay",
          color: "neon-blue",
          params: [k("time", "Dly Time", 4), k("mix", "Dly Mix", 3)],
        },
        {
          id: "mod",
          label: "Mod",
          color: "neon-emerald",
          params: [k("speed", "Mod Speed", 3), k("fx", "Mod FX", 4)],
        },
        {
          id: "amp",
          label: "Amp",
          color: "neon-red",
          params: [
            k("volume", "Volume", 6),
            k("bass", "Bass", 5),
            k("middle", "Middle", 5),
            k("treble", "Treble", 5),
            k("gain", "Gain", 6),
            sw("type", "Type", 1),
          ],
        },
        {
          id: "gate",
          label: "Noise Gate",
          color: "neon-white",
          params: [k("depth", "Gate", 3)],
        },
      ],
      footswitches: [
        { id: "fs-a", label: "A", togglesBlockId: "reverb", arcLabel: "Reverb" },
        { id: "fs-b", label: "B", togglesBlockId: "delay", arcLabel: "Delay" },
        { id: "fs-c", label: "C", togglesBlockId: "mod", arcLabel: "Mod" },
        { id: "fs-d", label: "D", togglesBlockId: "amp", arcLabel: "Amp" },
      ],
    },
  },
  {
    id: "demo-papa",
    name: "M-Vave Papa Blues",
    slug: "papa-blues",
    config: {
      brand: "M-VAVE",
      chassisColor: "#c9a227",
      chassisFinish: "metallic",
      screenStyle: "lcd-mono",
      hasSevenSegment: false,
      hasExpressionPedal: true,
      globalLedColor: "neon-amber",
      globalKnobs: [k("volume", "Volume", 6), k("expression", "Expressão", 0)],
      effectBlocks: [
        {
          id: "overdrive",
          label: "Overdrive",
          color: "neon-amber",
          params: [k("drive", "Drive", 5), k("tone", "Tone", 5), k("level", "Level", 6)],
        },
      ],
      footswitches: [{ id: "fs-on", label: "ON", togglesBlockId: "overdrive" }],
    },
  },
];
