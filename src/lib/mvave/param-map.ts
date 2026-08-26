import type { KnobParam, PedalModelConfig, PresetSettings } from "@/types/pedal";
import { isSteppedParam } from "@/types/pedal";

/**
 * Mapa "knob da tela ↔ Control Change do aparelho".
 *
 * A M-Vave não publica a tabela de CCs de cada modelo, e ela muda de firmware
 * para firmware. Em vez de chutar números, o mapa é aprendido: o usuário mexe
 * no knob real, a gente escuta o CC que chegou e guarda a associação no próprio
 * navegador — o mesmo truque de "MIDI learn" de qualquer DAW.
 */

export type ParamRef = {
  /** null = knob global (Master/Volume), fora dos blocos de efeito. */
  blockId: string | null;
  paramId: string;
};

export type CcBinding = { channel: number; controller: number };

/** Mapa de um modelo: chave do parâmetro -> CC. */
export type DeviceMap = Record<string, CcBinding>;

export function paramKey(ref: ParamRef) {
  return `${ref.blockId ?? "_global"}.${ref.paramId}`;
}

const storageKey = (modelSlug: string) => `mvave:map:${modelSlug}`;

export function loadDeviceMap(modelSlug: string): DeviceMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(modelSlug));
    return raw ? (JSON.parse(raw) as DeviceMap) : {};
  } catch {
    // localStorage bloqueado (aba anônima com cookies off): segue sem mapa.
    return {};
  }
}

export function saveDeviceMap(modelSlug: string, map: DeviceMap) {
  try {
    window.localStorage.setItem(storageKey(modelSlug), JSON.stringify(map));
  } catch {
    /* sem persistência: o mapa vale só para esta sessão */
  }
}

/** Acha de quem é o CC recebido — o mapa é pequeno, varredura direta serve. */
export function findParamByCc(map: DeviceMap, channel: number, controller: number) {
  return Object.entries(map).find(
    ([, b]) => b.controller === controller && b.channel === channel,
  )?.[0];
}

/** Valor do knob (min..max) para o 0..127 do MIDI. */
export function valueToCc(param: KnobParam, value: number) {
  const pct = (value - param.min) / (param.max - param.min);
  return Math.max(0, Math.min(127, Math.round(pct * 127)));
}

/** 0..127 do MIDI para o valor do knob, já encaixado no passo do parâmetro. */
export function ccToValue(param: KnobParam, cc: number) {
  const raw = param.min + (cc / 127) * (param.max - param.min);
  const snapped = Math.round((raw - param.min) / param.step) * param.step + param.min;
  const clamped = Math.max(param.min, Math.min(param.max, snapped));
  return isSteppedParam(param) ? Math.round(clamped) : Math.round(clamped * 1000) / 1000;
}

/** Todos os parâmetros do painel numa lista chata, na ordem em que aparecem. */
export function flattenParams(config: PedalModelConfig) {
  const items: { ref: ParamRef; param: KnobParam; label: string }[] = [];
  for (const param of config.globalKnobs) {
    items.push({ ref: { blockId: null, paramId: param.id }, param, label: param.label });
  }
  for (const block of config.effectBlocks) {
    for (const param of block.params) {
      items.push({
        ref: { blockId: block.id, paramId: param.id },
        param,
        label: `${block.label} · ${param.label}`,
      });
    }
  }
  return items;
}

export function readSetting(settings: PresetSettings, ref: ParamRef) {
  return ref.blockId === null
    ? settings.globalKnobs[ref.paramId]
    : settings.blocks[ref.blockId]?.params[ref.paramId];
}

/** Devolve uma cópia do preset com um parâmetro alterado (nunca muta o estado). */
export function writeSetting(
  settings: PresetSettings,
  ref: ParamRef,
  value: number,
): PresetSettings {
  if (ref.blockId === null) {
    return {
      ...settings,
      globalKnobs: { ...settings.globalKnobs, [ref.paramId]: value },
    };
  }
  const block = settings.blocks[ref.blockId];
  if (!block) return settings;
  return {
    ...settings,
    blocks: {
      ...settings.blocks,
      [ref.blockId]: { ...block, params: { ...block.params, [ref.paramId]: value } },
    },
  };
}
