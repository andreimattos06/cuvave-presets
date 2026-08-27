"use client";

import { useState } from "react";
import {
  MAX_PRESETS_PER_TRACK,
  useUploadWizard,
} from "@/lib/store/upload-wizard";
import { PedalBoard } from "@/components/pedalboard/pedal-board";
import { TkgImportDialog } from "@/components/mvave/tkg-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PedalModel, PresetSettings } from "@/types/pedal";
import { Guitar, Plus, Trash2 } from "lucide-react";
import { LIMITS } from "@/lib/validations/limits";

export function StepPresets({ models }: { models: PedalModel[] }) {
  const { tracks, addPreset, updatePreset, setBoardSettings, removePreset } =
    useUploadWizard();
  const [activeTrack, setActiveTrack] = useState(tracks[0]?.localId ?? "");
  const [activePreset, setActivePreset] = useState(
    tracks[0]?.presets[0]?.localId ?? "",
  );
  /** Pedaleira aberta no painel — vale para a faixa toda, não só para um preset. */
  const [activeModelId, setActiveModelId] = useState("");

  const track = tracks.find((t) => t.localId === activeTrack) ?? tracks[0];
  const preset =
    track?.presets.find((p) => p.localId === activePreset) ?? track?.presets[0];

  // As pedaleiras do instrumento, na ordem em que a pessoa escolheu.
  const trackModels = (track?.pedalModelIds ?? [])
    .map((id) => models.find((m) => m.id === id))
    .filter((m) => m !== undefined);

  const board =
    preset?.boards.find((b) => b.pedalModelId === activeModelId) ?? preset?.boards[0];
  const model =
    models.find((m) => m.id === board?.pedalModelId) ?? trackModels[0] ?? models[0];

  if (!track || !preset || !board || !model) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
        Volte ao passo anterior e adicione pelo menos um instrumento.
      </p>
    );
  }

  function changeSettings(settings: PresetSettings) {
    if (!track || !preset || !board) return;
    setBoardSettings(track.localId, preset.localId, board.localId, settings);
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
              setActiveModelId("");
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
            onClick={() => addPreset(track.localId, trackModels)}
          >
            <Plus className="size-4" />
            Preset
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {track.presets.length}/{MAX_PRESETS_PER_TRACK}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Um preset por trecho da música — solo, refrão, verso. Cada um pode vir de
        um arquivo .tkg que você já criou na pedaleira: use{" "}
        <span className="text-foreground">Importar da pedaleira</span> aqui embaixo.
      </p>

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
            <Label>Pedaleira</Label>
            {preset.boards.length > 1 ? (
              // Mais de um aparelho no mesmo trecho: a pessoa ajusta um de cada
              // vez, e quem for ver o envio escolhe qual quer olhar.
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {preset.boards.map((b) => {
                  const boardModel = models.find((m) => m.id === b.pedalModelId);
                  return (
                    <button
                      key={b.localId}
                      type="button"
                      onClick={() => setActiveModelId(b.pedalModelId)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        b.localId === board.localId
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-white/10 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {boardModel?.name ?? "pedaleira"}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1.5 flex h-9 items-center rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-sm">
                {model.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Puxa o som direto do aparelho em vez de refazer knob por knob:
              cada trecho da música tem o seu, então o botão é por preset. */}
          <TkgImportDialog
            model={model}
            settings={board.settings}
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
        key={board.localId}
        modelName={model.name}
        config={model.config}
        presetName={preset.name}
        value={board.settings}
        onChange={changeSettings}
      />
    </div>
  );
}
