"use client";

import { useState } from "react";
import {
  MAX_PRESETS_PER_TRACK,
  useUploadWizard,
} from "@/lib/store/upload-wizard";
import { PedalBoard } from "@/components/pedalboard/pedal-board";
import { DeviceTransfer } from "@/components/mvave/device-transfer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PedalModel, PresetSettings } from "@/types/pedal";
import { Guitar, Plus, Trash2 } from "lucide-react";
import { LIMITS } from "@/lib/validations/limits";

export function StepPresets({ models }: { models: PedalModel[] }) {
  const { tracks, addPreset, updatePreset, removePreset } = useUploadWizard();
  const [activeTrack, setActiveTrack] = useState(tracks[0]?.localId ?? "");
  const [activePreset, setActivePreset] = useState(
    tracks[0]?.presets[0]?.localId ?? "",
  );

  const track = tracks.find((t) => t.localId === activeTrack) ?? tracks[0];
  const preset =
    track?.presets.find((p) => p.localId === activePreset) ?? track?.presets[0];
  // A pedaleira é do instrumento: todos os presets da faixa editam o mesmo painel.
  const model = models.find((m) => m.id === track?.pedalModelId) ?? models[0];

  if (!track || !preset) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
        Volte ao passo anterior e adicione pelo menos um instrumento.
      </p>
    );
  }

  function changeSettings(settings: PresetSettings) {
    if (!track || !preset) return;
    updatePreset(track.localId, preset.localId, { settings });
  }

  return (
    <div className="space-y-5">
      {/* faixas */}
      <div className="flex flex-wrap gap-2">
        {tracks.map((t) => (
          <button
            key={t.localId}
            type="button"
            onClick={() => {
              setActiveTrack(t.localId);
              setActivePreset(t.presets[0]?.localId ?? "");
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              t.localId === track.localId
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-white/10 text-muted-foreground hover:text-foreground",
            )}
          >
            <Guitar className="size-3" />
            {t.name}
          </button>
        ))}
      </div>

      {/* presets da faixa ativa */}
      <div className="flex flex-wrap items-center gap-2">
        {track.presets.map((p, i) => (
          <button
            key={p.localId}
            type="button"
            onClick={() => setActivePreset(p.localId)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              p.localId === preset.localId
                ? "border-accent/50 bg-accent/15 text-accent"
                : "border-white/10 text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="mr-1.5 font-mono opacity-60">{i + 1}</span>
            {p.name || "sem nome"}
          </button>
        ))}

        {track.presets.length < MAX_PRESETS_PER_TRACK && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addPreset(track.localId, model)}
          >
            <Plus className="size-4" />
            Preset
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {track.presets.length}/{MAX_PRESETS_PER_TRACK}
        </span>
      </div>

      {/* edição do preset ativo */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="preset-name">Nome do preset</Label>
            <Input
              id="preset-name"
              value={preset.name}
              maxLength={LIMITS.presetNameMax}
              onChange={(e) =>
                updatePreset(track.localId, preset.localId, {
                  name: e.target.value,
                })
              }
              placeholder="Ex.: solo, refrão, limpo"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Pedaleira do instrumento</Label>
            <p className="mt-1.5 flex h-9 items-center rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-sm">
              {model.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Puxa o som direto do aparelho em vez de refazer knob por knob. */}
          <DeviceTransfer
            model={model}
            presetName={preset.name}
            settings={preset.settings}
            onImport={changeSettings}
          />

          {track.presets.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                removePreset(track.localId, preset.localId);
                setActivePreset(
                  track.presets.find((p) => p.localId !== preset.localId)?.localId ??
                    "",
                );
              }}
            >
              <Trash2 className="size-4" />
              Remover preset
            </Button>
          )}
        </div>
      </div>

      <PedalBoard
        modelName={model.name}
        config={model.config}
        presetName={preset.name}
        value={preset.settings}
        onChange={changeSettings}
      />
    </div>
  );
}
