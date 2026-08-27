import type { KnobParam, PedalModelConfig, PresetSettings } from "@/types/pedal";
import { createDefaultPresetSettings, formatParamValue } from "@/types/pedal";

/**
 * Arquivo .tkg — o formato de preset do app oficial da M-Vave Tank-G.
 *
 * São 21 bytes crus, sem cabeçalho nem checksum: um byte por parâmetro, na
 * ordem fixa abaixo. O mapa foi levantado a partir de um preset gerado no
 * aparelho com valores propositalmente distintos (gate 99, amp tipo 5 e o resto
 * do amp em 23, mod 10, delay 5, reverb 3, cab 4), que produziu:
 *
 *   01 01 01 01 63 04 17 17 17 17 17 09 0A 04 05 02 03 04 00 00 00
 *
 * Duas leituras saem daí e valem para todo o formato:
 *
 * 1. os knobs do aparelho andam de 0 a 100 (por isso o painel da Tank-G usa
 *    essa escala, e não 0–10 como os outros modelos do site);
 * 2. as chaves de tipo (Amp, Mod, Delay, Reverb) são gravadas a partir do zero
 *    — Type 5 vira 0x04 —, enquanto o IR Cab é gravado com o próprio número.
 *
 * O Master não aparece no arquivo: na Tank-G ele é um knob analógico de saída,
 * fora do preset. Na importação ele fica como estava.
 */

const TKG_MODEL_SLUG = "tank-g";
export const TKG_BYTE_LENGTH = 21;

/** Só a Tank-G grava .tkg; os outros modelos usam o código de preset do site. */
export function supportsTkg(modelSlug: string) {
  return modelSlug === TKG_MODEL_SLUG;
}

/** Um byte por footswitch: 0 = bloco em bypass, 1 = ligado. */
const ENABLE_BYTES: { offset: number; blockId: string }[] = [
  { offset: 0, blockId: "amp" },
  { offset: 1, blockId: "mod" },
  { offset: 2, blockId: "delay" },
  { offset: 3, blockId: "reverb" },
];

type ValueByte = {
  offset: number;
  blockId: string;
  paramId: string;
  /** Chave gravada a partir do zero: o byte é o valor do painel menos 1. */
  zeroBased?: boolean;
};

const VALUE_BYTES: ValueByte[] = [
  { offset: 4, blockId: "gate", paramId: "depth" },
  { offset: 5, blockId: "amp", paramId: "type", zeroBased: true },
  // Ordem do aparelho, e não a da serigrafia: exportar um preset com Gain 60 /
  // Volume 60 / Bass 50 / Middle 50 / Treble 50 e reabrir no app mostrou que os
  // bytes 7 e 10 são Treble e Volume, não Volume e Treble.
  { offset: 6, blockId: "amp", paramId: "gain" },
  { offset: 7, blockId: "amp", paramId: "treble" },
  { offset: 8, blockId: "amp", paramId: "middle" },
  { offset: 9, blockId: "amp", paramId: "bass" },
  { offset: 10, blockId: "amp", paramId: "volume" },
  { offset: 11, blockId: "mod", paramId: "type", zeroBased: true },
  { offset: 12, blockId: "mod", paramId: "level" },
  { offset: 13, blockId: "delay", paramId: "type", zeroBased: true },
  { offset: 14, blockId: "delay", paramId: "level" },
  { offset: 15, blockId: "reverb", paramId: "type", zeroBased: true },
  { offset: 16, blockId: "reverb", paramId: "level" },
  { offset: 17, blockId: "cab", paramId: "ir" },
];

export class TkgError extends Error {}

function findParam(
  config: PedalModelConfig,
  blockId: string,
  paramId: string,
): KnobParam | undefined {
  return config.effectBlocks
    .find((block) => block.id === blockId)
    ?.params.find((param) => param.id === paramId);
}

function clampToParam(param: KnobParam, value: number) {
  return Math.min(param.max, Math.max(param.min, Math.round(value)));
}

/** Preset do site -> os 21 bytes que o app da pedaleira lê. */
export function encodeTkg(
  config: PedalModelConfig,
  settings: PresetSettings,
  // Buffer próprio (e não ArrayBufferLike) para o array servir de BlobPart no
  // download sem cópia intermediária.
): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(TKG_BYTE_LENGTH);

  for (const { offset, blockId } of ENABLE_BYTES) {
    // Bloco que o painel não tem conta como ligado — é o estado de fábrica.
    bytes[offset] = settings.blocks[blockId]?.enabled === false ? 0 : 1;
  }

  for (const entry of VALUE_BYTES) {
    const param = findParam(config, entry.blockId, entry.paramId);
    if (!param) continue;
    const raw = settings.blocks[entry.blockId]?.params?.[entry.paramId];
    const value = clampToParam(
      param,
      typeof raw === "number" && Number.isFinite(raw) ? raw : param.default,
    );
    bytes[entry.offset] = Math.min(255, Math.max(0, value - (entry.zeroBased ? 1 : 0)));
  }

  // Bytes 18–20 saem zerados, como no arquivo do aparelho.
  return bytes;
}

/** Os 21 bytes do aparelho -> preset do site, encaixado no painel do modelo. */
export function decodeTkg(
  config: PedalModelConfig,
  bytes: Uint8Array,
): PresetSettings {
  if (bytes.length !== TKG_BYTE_LENGTH) {
    throw new TkgError(
      `Esse arquivo tem ${bytes.length} bytes; um preset da Tank-G tem ${TKG_BYTE_LENGTH}.`,
    );
  }
  // Os quatro primeiros bytes são liga/desliga: qualquer outro valor ali quer
  // dizer que o arquivo não é da Tank-G (ou é de um firmware que não conheço).
  if (ENABLE_BYTES.some(({ offset }) => bytes[offset] > 1)) {
    throw new TkgError("Esse arquivo não parece um preset da Tank-G.");
  }

  const settings = createDefaultPresetSettings(config);

  for (const { offset, blockId } of ENABLE_BYTES) {
    if (settings.blocks[blockId]) settings.blocks[blockId].enabled = bytes[offset] === 1;
  }

  for (const entry of VALUE_BYTES) {
    const param = findParam(config, entry.blockId, entry.paramId);
    if (!param) continue;
    settings.blocks[entry.blockId].params[entry.paramId] = clampToParam(
      param,
      bytes[entry.offset] + (entry.zeroBased ? 1 : 0),
    );
  }

  return settings;
}

/** Tira o que o Windows e o Android não aceitam em nome de arquivo. */
function safePart(text: string | undefined) {
  return (text ?? "")
    .trim()
    .replace(/[\/:*?"<>|]+/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 60);
}

/**
 * Nome do arquivo: música, instrumento e preset, para a pessoa achar o preset
 * certo no meio de uma pasta cheia deles — "November Rain - Guitarra principal
 * - Primeiro solo.tkg".
 */
export function tkgFileName(parts: {
  song?: string;
  track?: string;
  preset?: string;
}) {
  const name = [parts.song, parts.track, parts.preset]
    .map(safePart)
    .filter(Boolean)
    .join(" - ");
  return `${name || "Tank G"}.tkg`;
}

export type PresetSummaryRow = {
  blockId: string;
  blockLabel: string;
  enabled: boolean;
  /** Bloco que não tem footswitch: mostrar "bypass" ali só confundiria. */
  switchable: boolean;
  params: { id: string; label: string; text: string; changed: boolean }[];
};

/**
 * Lista legível de um preset, para a pessoa conferir o que veio do arquivo
 * antes de aplicar. Com `compareTo`, marca o que muda em relação ao preset
 * que está aberto.
 */
export function summarizePreset(
  config: PedalModelConfig,
  settings: PresetSettings,
  compareTo?: PresetSettings,
): PresetSummaryRow[] {
  const switchable = new Set(
    config.footswitches.map((fs) => fs.togglesBlockId).filter(Boolean) as string[],
  );

  return config.effectBlocks.map((block) => {
    const current = settings.blocks[block.id];
    const previous = compareTo?.blocks[block.id];
    return {
      blockId: block.id,
      blockLabel: block.label,
      enabled: current?.enabled ?? true,
      switchable: switchable.has(block.id),
      params: block.params.map((param) => {
        const value = current?.params?.[param.id] ?? param.default;
        const before = previous?.params?.[param.id];
        return {
          id: param.id,
          label: param.label,
          text: formatParamValue(param, value),
          changed: typeof before === "number" && before !== value,
        };
      }),
    };
  });
}
