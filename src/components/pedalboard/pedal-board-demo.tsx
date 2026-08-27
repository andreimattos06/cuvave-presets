"use client";

import { useState } from "react";
import { PedalBoard } from "./pedal-board";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LIMITS } from "@/lib/validations/limits";
import {
  createDefaultPresetSettings,
  type PedalModel,
  type PresetSettings,
} from "@/types/pedal";

export function PedalBoardDemo({ models }: { models: PedalModel[] }) {
  const [modelIndex, setModelIndex] = useState(0);
  const [presetName, setPresetName] = useState("Solo do refrão");
  const [readOnly, setReadOnly] = useState(false);

  const model = models[modelIndex];
  const [settings, setSettings] = useState<PresetSettings>(() =>
    createDefaultPresetSettings(model.config),
  );

  function selectModel(index: number) {
    setModelIndex(index);
    setSettings(createDefaultPresetSettings(models[index].config));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-wrap gap-2">
          {models.map((m, i) => (
            <Button
              key={m.slug}
              variant={i === modelIndex ? "default" : "outline"}
              size="sm"
              onClick={() => selectModel(i)}
            >
              {m.name}
            </Button>
          ))}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="preset-name">Nome do preset</Label>
          <Input
            id="preset-name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            maxLength={LIMITS.presetNameMax}
            className="w-56"
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch
            id="read-only"
            checked={readOnly}
            onCheckedChange={setReadOnly}
          />
          <Label htmlFor="read-only">Somente leitura</Label>
        </div>
      </div>

      <PedalBoard
        modelName={model.name}
        config={model.config}
        presetName={presetName}
        value={settings}
        onChange={setSettings}
        readOnly={readOnly}
      />

      <details className="rounded-lg border border-white/10 bg-black/20 p-4">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          JSON salvo em presets.settings
        </summary>
        <pre className="mt-3 overflow-x-auto font-mono text-xs text-muted-foreground">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </details>
    </div>
  );
}
