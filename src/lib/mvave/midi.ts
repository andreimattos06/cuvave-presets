/**
 * Ponte com a pedaleira física via Web MIDI (Chrome/Edge, por USB-C ou BLE MIDI).
 *
 * O app oficial (M-EFCS) troca presets num SysEx proprietário que a M-Vave não
 * documenta — nada de público descreve o formato. Então o transporte aqui é o
 * MIDI padrão que o aparelho já fala de fábrica: Control Change para os knobs e
 * Program Change para trocar de slot. O SysEx que chega é guardado cru, para
 * quem quiser mandar o dump e ajudar a mapear o formato.
 */

/** ID de fabricante visto nos SysEx da marca (usado só para rotular o monitor). */
export const MVAVE_MANUFACTURER_ID = [0x00, 0x32, 0x45];

/** Nomes de porta MIDI usados pela linha M-Vave/Cuvave. */
const DEVICE_NAME_RE = /m-?vave|cuvave|tank|blackbox|cube|chocolate|mk-?\d|smk|fm1/i;

export type MidiPort = { id: string; name: string };

export type MidiMessage = {
  /** Rótulo curto para o monitor: "CC 24 = 88", "PC 3", "SysEx · 18 bytes". */
  label: string;
  data: Uint8Array;
  at: number;
};

export function isMidiSupported() {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.requestMIDIAccess === "function"
  );
}

export function looksLikeDevice(name: string | null | undefined) {
  return DEVICE_NAME_RE.test(name ?? "");
}

/** O acesso pede sysex: sem isso o navegador filtra as mensagens 0xF0. */
export function requestAccess() {
  return navigator.requestMIDIAccess({ sysex: true });
}

export function portName(port: { name: string | null; manufacturer?: string | null }) {
  return port.name?.trim() || port.manufacturer?.trim() || "porta sem nome";
}

export function isControlChange(data: Uint8Array) {
  return data.length >= 3 && (data[0] & 0xf0) === 0xb0;
}

export function readControlChange(data: Uint8Array) {
  return {
    channel: (data[0] & 0x0f) + 1,
    controller: data[1],
    value: data[2],
  };
}

export function controlChangeBytes(channel: number, controller: number, value: number) {
  return new Uint8Array([0xb0 | ((channel - 1) & 0x0f), controller & 0x7f, value & 0x7f]);
}

export function programChangeBytes(channel: number, program: number) {
  return new Uint8Array([0xc0 | ((channel - 1) & 0x0f), program & 0x7f]);
}

export function toHex(data: Uint8Array) {
  return Array.from(data, (b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

/** Rótulo legível de uma mensagem, para o monitor da tela. */
export function describeMessage(data: Uint8Array) {
  if (data[0] === 0xf0) {
    const known = MVAVE_MANUFACTURER_ID.every((b, i) => data[i + 1] === b);
    return `SysEx${known ? " M-Vave" : ""} · ${data.length} bytes`;
  }
  if (isControlChange(data)) {
    const cc = readControlChange(data);
    return `CC ${cc.controller} = ${cc.value} (canal ${cc.channel})`;
  }
  const status = data[0] & 0xf0;
  const channel = (data[0] & 0x0f) + 1;
  if (status === 0xc0) return `PC ${data[1]} (canal ${channel})`;
  if (status === 0x90) return `Nota ${data[1]} on (canal ${channel})`;
  if (status === 0x80) return `Nota ${data[1]} off (canal ${channel})`;
  return `${toHex(data)}`;
}
