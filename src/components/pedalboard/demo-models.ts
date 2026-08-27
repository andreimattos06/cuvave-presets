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

/**
 * Knob da Tank-G: o aparelho grava 0 a 100 em cada parâmetro (ver o mapa do
 * .tkg em src/lib/mvave/tkg.ts), então o painel usa a mesma escala em vez dos
 * 0–10 dos outros modelos — assim o número da tela é o número do aparelho.
 */
const tg = (id: string, label: string, def: number) => ({
  id,
  label,
  min: 0,
  max: 100,
  step: 1,
  default: def,
});

/**
 * Type e Level de Mod, Delay e Reverb: 1 a 100. Não chegam a zero — quem
 * desliga o bloco é o footswitch, não o knob.
 */
const tgOn = (id: string, label: string, def: number) => ({
  id,
  label,
  min: 1,
  max: 100,
  step: 1,
  default: def,
});

/** Amp Type: 9 modelos de amplificador. */
const tgAmp = (id: string, label: string, def: number) => ({
  id,
  label,
  min: 1,
  max: 9,
  step: 1,
  default: def,
});

/** IR Cab: 9 gabinetes mais a posição 0, que é o aparelho sem IR nenhum. */
const tgCab = (id: string, label: string, def: number) => ({
  id,
  label,
  min: 0,
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
      globalKnobs: [tg("master", "Master", 70)],
      // A ordem dos knobs dentro de cada bloco é a mesma dos bytes do .tkg.
      effectBlocks: [
        {
          id: "cab",
          label: "IR Cab",
          color: "neon-amber",
          params: [tgCab("ir", "IR Cab", 1)],
        },
        {
          id: "reverb",
          label: "Reverb",
          color: "neon-violet",
          params: [tgOn("type", "Rvb Type", 1), tgOn("level", "Rvb Level", 30)],
        },
        {
          id: "delay",
          label: "Delay",
          color: "neon-blue",
          params: [tgOn("type", "Dly Type", 1), tgOn("level", "Dly Level", 30)],
        },
        {
          id: "mod",
          label: "Mod",
          color: "neon-emerald",
          params: [tgOn("type", "Mod Type", 1), tgOn("level", "Mod Level", 30)],
        },
        {
          id: "amp",
          label: "Amp",
          color: "neon-red",
          params: [
            tgAmp("type", "Type", 1),
            tg("gain", "Gain", 60),
            tg("treble", "Treble", 50),
            tg("middle", "Middle", 50),
            tg("bass", "Bass", 50),
            tg("volume", "Volume", 60),
          ],
        },
        {
          id: "gate",
          label: "Noise Gate",
          color: "neon-white",
          params: [tg("depth", "Gate", 30)],
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
