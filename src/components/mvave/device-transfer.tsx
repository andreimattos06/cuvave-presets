"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ParamLearnList } from "@/components/mvave/param-learn-list";
import { MidiMonitor } from "@/components/mvave/midi-monitor";
import { useMvaveDevice } from "@/lib/mvave/use-mvave-device";
import { isControlChange, readControlChange } from "@/lib/mvave/midi";
import {
  ccToValue,
  flattenParams,
  loadDeviceMap,
  paramKey,
  readSetting,
  saveDeviceMap,
  valueToCc,
  writeSetting,
  type DeviceMap,
} from "@/lib/mvave/param-map";
import {
  PresetCodeError,
  decodePresetCode,
  encodePresetCode,
  fitToModel,
} from "@/lib/mvave/preset-code";
import type { PedalModelConfig, PresetSettings } from "@/types/pedal";
import { Cable, Copy, Download, Plug, Upload } from "lucide-react";

/**
 * Transferência de presets entre o site e a pedaleira.
 *
 * Dois caminhos, porque nenhum sozinho cobre todo mundo:
 * 1. cabo ou Bluetooth via Web MIDI (só em navegador Chromium), que troca os
 *    valores dos knobs por Control Change;
 * 2. código de texto, que funciona em qualquer navegador e viaja por WhatsApp.
 */
export function DeviceTransfer({
  model,
  presetName,
  settings,
  onImport,
  triggerLabel,
}: {
  model: { slug: string; name: string; config: PedalModelConfig };
  presetName: string;
  settings: PresetSettings;
  /** Quando presente, o painel também escreve no preset (fluxo de envio). */
  onImport?: (settings: PresetSettings) => void;
  triggerLabel?: string;
}) {
  const device = useMvaveDevice();
  const { addListener } = device;

  const [open, setOpen] = useState(false);
  const [map, setMap] = useState<DeviceMap>({});
  const [learningKey, setLearningKey] = useState<string | null>(null);
  const [mirror, setMirror] = useState(false);
  const [slot, setSlot] = useState("1");
  const [pastedCode, setPastedCode] = useState("");

  const items = useMemo(() => flattenParams(model.config), [model.config]);
  const byKey = useMemo(
    () => new Map(items.map((item) => [paramKey(item.ref), item])),
    [items],
  );

  // O espelho aplica uma mudança atrás da outra: precisa do preset mais novo,
  // não do que existia quando o listener foi registrado.
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  function handleOpenChange(next: boolean) {
    // O mapa mora no localStorage: lê na abertura, quando já estamos no cliente.
    if (next) setMap(loadDeviceMap(model.slug));
    setOpen(next);
  }

  const updateMap = useCallback(
    (next: DeviceMap) => {
      setMap(next);
      saveDeviceMap(model.slug, next);
    },
    [model.slug],
  );

  // Aprendizado: o primeiro CC que chegar vira o binding do knob selecionado.
  useEffect(() => {
    if (!learningKey) return;
    return addListener((message) => {
      if (!isControlChange(message.data)) return;
      const cc = readControlChange(message.data);
      const item = byKey.get(learningKey);
      updateMap({
        ...loadDeviceMap(model.slug),
        [learningKey]: { channel: cc.channel, controller: cc.controller },
      });
      setLearningKey(null);
      toast.success(`${item?.label ?? "Knob"} agora responde ao CC ${cc.controller}.`);
    });
  }, [learningKey, addListener, byKey, model.slug, updateMap]);

  // Espelho: o que o usuário mexe no aparelho aparece no painel da tela.
  useEffect(() => {
    if (!mirror || !onImport) return;
    return addListener((message) => {
      if (!isControlChange(message.data)) return;
      const cc = readControlChange(message.data);
      for (const [key, binding] of Object.entries(map)) {
        if (binding.controller !== cc.controller || binding.channel !== cc.channel) {
          continue;
        }
        const item = byKey.get(key);
        if (!item) continue;
        onImport(
          writeSetting(settingsRef.current, item.ref, ccToValue(item.param, cc.value)),
        );
      }
    });
  }, [mirror, onImport, addListener, map, byKey]);

  const boundCount = Object.keys(map).length;
  const connected = device.status === "ready";

  function sendPreset() {
    const entries = Object.entries(map);
    if (!entries.length) {
      toast.error("Nenhum knob mapeado ainda — use o Aprender primeiro.");
      return;
    }
    let sent = 0;
    for (const [key, binding] of entries) {
      const item = byKey.get(key);
      if (!item) continue;
      const value = readSetting(settings, item.ref);
      if (typeof value !== "number") continue;
      const ok = device.sendControlChange(
        binding.channel,
        binding.controller,
        valueToCc(item.param, value),
      );
      if (ok) sent += 1;
    }
    toast[sent ? "success" : "error"](
      sent
        ? `${sent} ${sent === 1 ? "knob enviado" : "knobs enviados"} para ${device.deviceName ?? "a pedaleira"}.`
        : "Nada foi enviado: escolha a porta de saída da pedaleira.",
    );
  }

  function changeSlot() {
    const program = Number(slot) - 1;
    if (!Number.isInteger(program) || program < 0 || program > 127) {
      toast.error("Informe um slot entre 1 e 128.");
      return;
    }
    const ok = device.sendProgramChange(1, program);
    toast[ok ? "success" : "error"](
      ok ? `Program Change ${program} enviado.` : "Escolha a porta de saída da pedaleira.",
    );
  }

  const code = useMemo(
    () => encodePresetCode({ model: model.slug, name: presetName, settings }),
    [model.slug, presetName, settings],
  );

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    toast.success("Código copiado.");
  }

  function downloadCode() {
    const blob = new Blob(
      [JSON.stringify({ model: model.slug, name: presetName, settings }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${presetName || "preset"}.mvave.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function applyCode(raw: string) {
    if (!onImport) return;
    try {
      const shared = decodePresetCode(raw);
      onImport(fitToModel(model.config, shared.settings));
      setPastedCode("");
      toast.success(
        shared.model === model.slug
          ? `Preset "${shared.name}" carregado.`
          : `Preset de outro modelo (${shared.model}) — aproveitei o que encaixa aqui.`,
      );
    } catch (err) {
      toast.error(
        err instanceof PresetCodeError ? err.message : "Não consegui ler esse código.",
      );
    }
  }

  async function applyFile(file: File) {
    const text = await file.text();
    if (text.trimStart().startsWith("{")) {
      try {
        const parsed = JSON.parse(text) as { settings?: PresetSettings; name?: string };
        if (!parsed.settings) throw new Error("arquivo sem settings");
        onImport?.(fitToModel(model.config, parsed.settings));
        toast.success(`Preset "${parsed.name ?? file.name}" carregado.`);
      } catch {
        toast.error("Esse arquivo não é um preset do M-Vave Presets.");
      }
      return;
    }
    applyCode(text);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Cable className="size-4" />
            {triggerLabel ??
              (onImport ? "Importar da pedaleira" : "Enviar para a pedaleira")}
          </Button>
        }
      />

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Minha pedaleira</DialogTitle>
          <DialogDescription>
            {model.name} — troque o preset por cabo/Bluetooth ou por código de texto.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="device">
          <TabsList>
            <TabsTrigger value="device">Pedaleira</TabsTrigger>
            <TabsTrigger value="code">Código do preset</TabsTrigger>
          </TabsList>

          <TabsContent value="device" className="space-y-4">
            {!device.supported ? (
              <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-muted-foreground">
                Este navegador não fala MIDI. A conexão direta com a pedaleira
                precisa de Chrome, Edge, Brave ou Opera — no Firefox e no Safari,
                use a aba do código do preset.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => void device.connect()}
                    disabled={device.status === "connecting"}
                  >
                    <Plug className="size-4" />
                    {connected ? "Reconectar" : "Conectar pedaleira"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {connected
                      ? (device.deviceName ?? "conectado")
                      : device.status === "connecting"
                        ? "procurando…"
                        : "desconectado"}
                  </span>
                </div>

                {device.error && <p className="text-sm text-destructive">{device.error}</p>}

                {connected && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="midi-in">Entrada MIDI</Label>
                      <select
                        id="midi-in"
                        value={device.inputId ?? ""}
                        onChange={(e) => device.setInputId(e.target.value)}
                        className="mt-1.5 h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-sm"
                      >
                        {device.inputs.length === 0 && <option value="">nenhuma</option>}
                        {device.inputs.map((port) => (
                          <option key={port.id} value={port.id}>
                            {port.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="midi-out">Saída MIDI</Label>
                      <select
                        id="midi-out"
                        value={device.outputId ?? ""}
                        onChange={(e) => device.setOutputId(e.target.value)}
                        className="mt-1.5 h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-sm"
                      >
                        {device.outputs.length === 0 && <option value="">nenhuma</option>}
                        {device.outputs.map((port) => (
                          <option key={port.id} value={port.id}>
                            {port.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={sendPreset}
                    disabled={!connected}
                  >
                    <Upload className="size-4" />
                    Enviar knobs para a pedaleira
                  </Button>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="slot" className="text-xs text-muted-foreground">
                      Slot
                    </Label>
                    <Input
                      id="slot"
                      value={slot}
                      onChange={(e) => setSlot(e.target.value)}
                      inputMode="numeric"
                      className="h-9 w-16"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={changeSlot}
                      disabled={!connected}
                    >
                      Trocar
                    </Button>
                  </div>
                </div>

                {onImport && (
                  <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <Switch
                      id="mirror"
                      checked={mirror}
                      onCheckedChange={(checked) => setMirror(Boolean(checked))}
                      disabled={!connected}
                    />
                    <Label htmlFor="mirror" className="text-sm font-normal">
                      Espelhar: mexer no aparelho move os knobs da tela
                    </Label>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    A M-Vave não publica a tabela de CC de cada modelo, então o site
                    aprende com o aparelho: clique em Aprender e mexa no knob
                    correspondente. O mapa fica salvo neste navegador ({boundCount} de{" "}
                    {items.length} knobs).
                  </p>
                  <ParamLearnList
                    config={model.config}
                    map={map}
                    learningKey={learningKey}
                    onLearn={setLearningKey}
                    onForget={(key) => {
                      const next = { ...map };
                      delete next[key];
                      updateMap(next);
                    }}
                  />
                </div>

                <MidiMonitor messages={device.messages} onClear={device.clearMessages} />
              </>
            )}
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <div>
              <Label htmlFor="preset-code">Código deste preset</Label>
              <Textarea
                id="preset-code"
                readOnly
                value={code}
                rows={3}
                className="mt-1.5 font-mono text-xs"
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => void copyCode()}>
                  <Copy className="size-4" />
                  Copiar código
                </Button>
                <Button size="sm" variant="ghost" onClick={downloadCode}>
                  <Download className="size-4" />
                  Baixar arquivo
                </Button>
              </div>
            </div>

            {onImport && (
              <div>
                <Label htmlFor="paste-code">Carregar um preset</Label>
                <Textarea
                  id="paste-code"
                  value={pastedCode}
                  onChange={(e) => setPastedCode(e.target.value)}
                  rows={3}
                  placeholder="Cole aqui um código MVP1…"
                  className="mt-1.5 font-mono text-xs"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => applyCode(pastedCode)}
                    disabled={!pastedCode.trim()}
                  >
                    Aplicar código
                  </Button>
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void applyFile(file);
                      e.target.value = "";
                    }}
                    className="text-xs text-muted-foreground file:mr-2 file:rounded-md file:border file:border-white/10 file:bg-white/[0.03] file:px-3 file:py-1.5 file:text-xs file:text-foreground"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
