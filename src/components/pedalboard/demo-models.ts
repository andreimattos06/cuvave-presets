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

export const DEMO_MODELS: PedalModel[] = [
  {
    id: "demo-baby",
    name: "Cuvave Baby",
    slug: "baby",
    config: {
      brand: "CUVAVE",
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
    name: "Cuvave Tank-G",
    slug: "tank-g",
    config: {
      brand: "CUVAVE",
      chassisColor: "#4fbfae",
      chassisFinish: "metallic",
      screenStyle: "lcd-mono",
      hasSevenSegment: true,
      hasExpressionPedal: false,
      globalLedColor: "neon-cyan",
      globalKnobs: [k("master", "Master", 7)],
      effectBlocks: [
        {
          id: "cab",
          label: "IR Cab",
          color: "neon-amber",
          params: [k("ir", "Cab", 5)],
        },
        {
          id: "reverb",
          label: "Reverb",
          color: "neon-violet",
          params: [k("mix", "Rev Mix", 3), k("decay", "Decay", 4)],
        },
        {
          id: "delay",
          label: "Delay",
          color: "neon-cyan",
          params: [k("time", "Time", 4), k("fb", "FB", 3), k("mix", "Mix", 3)],
        },
        {
          id: "mod",
          label: "Mod",
          color: "neon-green",
          params: [k("rate", "Rate", 3), k("depth", "Depth", 4)],
        },
        {
          id: "amp",
          label: "Amp",
          color: "neon-rose",
          params: [
            k("gain", "Gain", 6),
            k("bass", "Bass", 5),
            k("middle", "Middle", 5),
            k("treble", "Treble", 5),
            k("volume", "Volume", 6),
          ],
        },
        {
          id: "gate",
          label: "Noise Gate",
          color: "neon-white",
          params: [k("depth", "Depth", 3)],
        },
      ],
      footswitches: [
        { id: "fs-a", label: "A", togglesBlockId: "reverb", arcLabel: "A / Reverb" },
        { id: "fs-b", label: "B", togglesBlockId: "delay", arcLabel: "B / Delay" },
        { id: "fs-c", label: "C", togglesBlockId: "mod", arcLabel: "C / Mod" },
        { id: "fs-d", label: "D", togglesBlockId: "amp", arcLabel: "D / Amp" },
      ],
    },
  },
  {
    id: "demo-papa",
    name: "Cuvave Papa Blues",
    slug: "papa-blues",
    config: {
      brand: "CUVAVE",
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
