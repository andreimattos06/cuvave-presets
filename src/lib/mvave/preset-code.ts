import type { PedalModelConfig, PresetSettings } from "@/types/pedal";
import { createDefaultPresetSettings } from "@/types/pedal";

/**
 * Código de preset — texto curto que carrega um preset inteiro.
 *
 * Serve para o caminho que não depende de cabo nem de navegador com Web MIDI:
 * copiar daqui e colar em outro lugar (ou salvar um arquivo .json e mandar para
 * alguém). O formato é nosso, e é declarado no prefixo para não confundir com
 * os códigos do app oficial.
 */

const PREFIX = "MVP1";

export type SharedPreset = {
  v: 1;
  model: string;
  name: string;
  settings: PresetSettings;
};

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string) {
  const padded = code.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodePresetCode(preset: Omit<SharedPreset, "v">) {
  return `${PREFIX}.${toBase64Url(JSON.stringify({ v: 1, ...preset }))}`;
}

export class PresetCodeError extends Error {}

export function decodePresetCode(code: string): SharedPreset {
  const trimmed = code.trim();
  const [prefix, body] = trimmed.split(".", 2);
  if (prefix !== PREFIX || !body) {
    throw new PresetCodeError(
      "Esse código não é do M-Vave Presets. Códigos daqui começam com MVP1.",
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(body));
  } catch {
    throw new PresetCodeError("Código incompleto ou corrompido.");
  }
  const preset = parsed as SharedPreset;
  if (preset?.v !== 1 || !preset.settings?.blocks || !preset.settings.globalKnobs) {
    throw new PresetCodeError("Código incompleto ou corrompido.");
  }
  return preset;
}

/**
 * Encaixa um preset recebido no painel do modelo aberto: mantém só o que existe
 * neste aparelho e completa o resto com o padrão de fábrica. Sem isso, um
 * preset de Tank-G colado numa Baby deixaria knobs sem valor.
 */
export function fitToModel(
  config: PedalModelConfig,
  incoming: PresetSettings,
): PresetSettings {
  const base = createDefaultPresetSettings(config);

  for (const param of config.globalKnobs) {
    const value = incoming.globalKnobs?.[param.id];
    if (typeof value === "number") base.globalKnobs[param.id] = value;
  }

  for (const block of config.effectBlocks) {
    const source = incoming.blocks?.[block.id];
    if (!source) continue;
    if (typeof source.enabled === "boolean") base.blocks[block.id].enabled = source.enabled;
    for (const param of block.params) {
      const value = source.params?.[param.id];
      if (typeof value === "number") base.blocks[block.id].params[param.id] = value;
    }
  }

  return base;
}
