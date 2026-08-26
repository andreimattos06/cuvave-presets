"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  controlChangeBytes,
  describeMessage,
  isMidiSupported,
  looksLikeDevice,
  portName,
  programChangeBytes,
  requestAccess,
  type MidiMessage,
  type MidiPort,
} from "./midi";

export type DeviceStatus = "idle" | "connecting" | "ready" | "denied" | "error";

const MAX_LOG = 60;

/** Web MIDI só existe no cliente; no servidor assumimos que sim para não piscar. */
const noopSubscribe = () => () => {};

/**
 * Conexão com a pedaleira e monitor do que ela manda.
 *
 * O navegador só entrega portas MIDI depois que o usuário autoriza, então nada
 * acontece antes de `connect()` — o pedido de permissão precisa nascer de um
 * clique dele.
 */
export function useMvaveDevice() {
  const [status, setStatus] = useState<DeviceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<MidiPort[]>([]);
  const [outputs, setOutputs] = useState<MidiPort[]>([]);
  const [inputId, setInputId] = useState<string | null>(null);
  const [outputId, setOutputId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MidiMessage[]>([]);

  const accessRef = useRef<MIDIAccess | null>(null);
  const listeners = useRef(new Set<(message: MidiMessage) => void>());

  const supported = useSyncExternalStore(
    noopSubscribe,
    () => isMidiSupported(),
    () => true,
  );

  const refreshPorts = useCallback((access: MIDIAccess) => {
    const ins = Array.from(access.inputs.values()).map((p) => ({
      id: p.id,
      name: portName(p),
    }));
    const outs = Array.from(access.outputs.values()).map((p) => ({
      id: p.id,
      name: portName(p),
    }));
    setInputs(ins);
    setOutputs(outs);
    // Escolhe sozinho a porta que parece ser da pedaleira; o usuário troca
    // depois se tiver mais de uma interface ligada.
    setInputId((current) =>
      current && ins.some((p) => p.id === current)
        ? current
        : (ins.find((p) => looksLikeDevice(p.name)) ?? ins[0])?.id ?? null,
    );
    setOutputId((current) =>
      current && outs.some((p) => p.id === current)
        ? current
        : (outs.find((p) => looksLikeDevice(p.name)) ?? outs[0])?.id ?? null,
    );
  }, []);

  const connect = useCallback(async () => {
    if (!isMidiSupported()) return;
    setStatus("connecting");
    setError(null);
    try {
      const access = await requestAccess();
      accessRef.current = access;
      refreshPorts(access);
      access.onstatechange = () => refreshPorts(access);
      setStatus("ready");
    } catch (err) {
      const denied = err instanceof DOMException && err.name === "SecurityError";
      setStatus(denied ? "denied" : "error");
      setError(
        denied
          ? "O navegador bloqueou o acesso MIDI. Libere a permissão do site e tente de novo."
          : "Não foi possível abrir o MIDI. Confira se a pedaleira está ligada e conectada.",
      );
    }
  }, [refreshPorts]);

  // Escuta a porta selecionada; troca de porta troca o listener.
  useEffect(() => {
    const access = accessRef.current;
    if (!access || !inputId) return;
    const input = access.inputs.get(inputId);
    if (!input) return;

    const handle = (event: MIDIMessageEvent) => {
      if (!event.data) return;
      const message: MidiMessage = {
        data: event.data,
        label: describeMessage(event.data),
        at: Date.now(),
      };
      setMessages((prev) => [message, ...prev].slice(0, MAX_LOG));
      for (const listener of listeners.current) listener(message);
    };

    input.addEventListener("midimessage", handle);
    return () => input.removeEventListener("midimessage", handle);
  }, [inputId, status]);

  const addListener = useCallback((listener: (message: MidiMessage) => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const sendRaw = useCallback(
    (data: Uint8Array) => {
      const output = outputId ? accessRef.current?.outputs.get(outputId) : undefined;
      if (!output) return false;
      output.send(data);
      return true;
    },
    [outputId],
  );

  const sendControlChange = useCallback(
    (channel: number, controller: number, value: number) =>
      sendRaw(controlChangeBytes(channel, controller, value)),
    [sendRaw],
  );

  const sendProgramChange = useCallback(
    (channel: number, program: number) => sendRaw(programChangeBytes(channel, program)),
    [sendRaw],
  );

  const deviceName =
    inputs.find((p) => p.id === inputId)?.name ??
    outputs.find((p) => p.id === outputId)?.name ??
    null;

  return {
    supported,
    status,
    error,
    inputs,
    outputs,
    inputId,
    outputId,
    deviceName,
    messages,
    connect,
    setInputId,
    setOutputId,
    addListener,
    sendRaw,
    sendControlChange,
    sendProgramChange,
    clearMessages: useCallback(() => setMessages([]), []),
  };
}
