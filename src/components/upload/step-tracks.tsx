"use client";

import { useState } from "react";
import {
  MAX_BOARDS_PER_PRESET,
  MAX_TRACKS_PER_UPLOAD,
  useUploadWizard,
} from "@/lib/store/upload-wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import type { PedalModel } from "@/types/pedal";
import { Guitar, Plus, Trash2 } from "lucide-react";
import { LIMITS } from "@/lib/validations/limits";

const SUGGESTIONS = [
  "Guitarra principal",
  "Guitarra ritmo",
  "Guitarra base",
  "Baixo",
];

export function StepTracks({ models }: { models: PedalModel[] }) {
  const {
    tracks,
    addTrack,
    renameTrack,
    setTrackModels,
    removeTrack,
    title,
    setTitle,
    note,
    setNote,
  } = useUploadWizard();
  const [draft, setDraft] = useState("");

  const full = tracks.length >= MAX_TRACKS_PER_UPLOAD;

  function add(name: string) {
    const clean = name.trim();
    if (!clean || full) return;
    addTrack(clean, models[0]);
    setDraft("");
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="upload-title">Nome do envio</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          É por esse nome que a galera vai identificar a sua versão na lista.
        </p>
        <Input
          id="upload-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: versão do álbum, tom de Si"
          maxLength={LIMITS.uploadTitleMax}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="track-name">Instrumentos</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Cada instrumento tem até 8 presets, e cada preset pode ser descrito em
          mais de uma pedaleira. Você dá o nome que quiser — no máximo{" "}
          {MAX_TRACKS_PER_UPLOAD} instrumentos por envio.
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add(draft);
          }}
        >
          <Input
            id="track-name"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ex.: guitarra principal"
            maxLength={LIMITS.trackNameMax}
            className="flex-1"
            disabled={full}
          />
          <Button type="submit" disabled={!draft.trim() || full}>
            <Plus className="size-4" />
            Adicionar
          </Button>
        </form>

        {full ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Limite de {MAX_TRACKS_PER_UPLOAD} instrumentos atingido.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.filter(
              (s) => !tracks.some((t) => t.name.toLowerCase() === s.toLowerCase()),
            ).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {tracks.length > 0 && (
        <ul className="space-y-2">
          {tracks.map((track) => (
            <li
              key={track.localId}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3"
            >
              <Guitar className="size-4 shrink-0 text-primary" />
              <Input
                value={track.name}
                onChange={(e) => renameTrack(track.localId, e.target.value)}
                aria-label="Nome do instrumento"
                maxLength={LIMITS.trackNameMax}
                className="min-w-40 flex-1 border-none bg-transparent px-0 focus-visible:ring-0"
              />
              <PedalPicker
                trackName={track.name}
                models={models}
                selected={track.pedalModelIds}
                onToggle={(modelId) => {
                  const next = track.pedalModelIds.includes(modelId)
                    ? track.pedalModelIds.filter((id) => id !== modelId)
                    : [...track.pedalModelIds, modelId];
                  // Instrumento sem pedaleira nenhuma não teria o que mostrar,
                  // e acima do teto o banco recusaria o envio.
                  if (next.length === 0 || next.length > MAX_BOARDS_PER_PRESET) return;
                  setTrackModels(
                    track.localId,
                    next
                      .map((id) => models.find((m) => m.id === id))
                      .filter((m) => m !== undefined),
                  );
                }}
              />
              <span className="shrink-0 text-xs text-muted-foreground">
                {track.presets.length}/8 presets
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${track.name}`}
                onClick={() => removeTrack(track.localId)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Label htmlFor="note">Observações (opcional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex.: baseado na versão ao vivo de 1997; o solo entra no 2º refrão."
          maxLength={LIMITS.uploadNoteMax}
          className="mt-1.5"
        />
      </div>
    </div>
  );
}

/**
 * Pedaleiras do instrumento. Um envio pode descrever o mesmo trecho em mais de
 * um aparelho ("assim na Tank-G, assim na Baby"), e quem for ver escolhe qual
 * quer olhar. Enquanto só houver um modelo liberado, isto vira um único chip
 * fixo — mas o caminho já está pronto para o dia em que houver mais.
 */
function PedalPicker({
  trackName,
  models,
  selected,
  onToggle,
}: {
  trackName: string;
  models: PedalModel[];
  selected: string[];
  onToggle: (modelId: string) => void;
}) {
  const single = models.length === 1;

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label={`Pedaleiras de ${trackName}`}
    >
      {models.map((model) => {
        const on = selected.includes(model.id);
        return (
          <button
            key={model.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            disabled={single}
            onClick={() => onToggle(model.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              on
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-white/10 text-muted-foreground hover:text-foreground",
              single && "cursor-default",
            )}
          >
            {model.name}
          </button>
        );
      })}
    </div>
  );
}
