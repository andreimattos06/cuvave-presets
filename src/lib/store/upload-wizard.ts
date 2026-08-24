import { create } from "zustand";
import type { PedalModel, PresetSettings } from "@/types/pedal";
import { createDefaultPresetSettings } from "@/types/pedal";

export const MAX_PRESETS_PER_TRACK = 8;
export const MAX_TRACKS_PER_UPLOAD = 10;

export type WizardPreset = {
  localId: string;
  name: string;
  settings: PresetSettings;
};

export type WizardTrack = {
  localId: string;
  name: string;
  /** Uma pedaleira por instrumento; todos os presets da faixa são dela. */
  pedalModelId: string;
  presets: WizardPreset[];
};

type WizardState = {
  step: number;
  bandId: string;
  bandName: string;
  songId: string;
  songTitle: string;
  title: string;
  note: string;
  tracks: WizardTrack[];

  setStep: (step: number) => void;
  setBand: (band: { id: string; name: string }) => void;
  setSong: (song: { id: string; title: string }) => void;
  setTitle: (title: string) => void;
  setNote: (note: string) => void;

  addTrack: (name: string, model: PedalModel) => void;
  renameTrack: (localId: string, name: string) => void;
  setTrackModel: (localId: string, model: PedalModel) => void;
  removeTrack: (localId: string) => void;

  addPreset: (trackId: string, model: PedalModel) => void;
  updatePreset: (
    trackId: string,
    presetId: string,
    patch: Partial<Omit<WizardPreset, "localId">>,
  ) => void;
  removePreset: (trackId: string, presetId: string) => void;

  reset: () => void;
};

const uid = () => crypto.randomUUID();

function makePreset(name: string, model: PedalModel): WizardPreset {
  return {
    localId: uid(),
    name,
    settings: createDefaultPresetSettings(model.config),
  };
}

const initial = {
  step: 0,
  bandId: "",
  bandName: "",
  songId: "",
  songTitle: "",
  title: "",
  note: "",
  tracks: [] as WizardTrack[],
};

export const useUploadWizard = create<WizardState>((set) => ({
  ...initial,

  setStep: (step) => set({ step }),
  setBand: (band) =>
    // Trocar de banda invalida a música escolhida antes.
    set({ bandId: band.id, bandName: band.name, songId: "", songTitle: "" }),
  setSong: (song) => set({ songId: song.id, songTitle: song.title }),
  setTitle: (title) => set({ title }),
  setNote: (note) => set({ note }),

  addTrack: (name, model) =>
    set((s) =>
      s.tracks.length >= MAX_TRACKS_PER_UPLOAD
        ? s
        : {
            tracks: [
              ...s.tracks,
              {
                localId: uid(),
                name,
                pedalModelId: model.id,
                presets: [makePreset("Base", model)],
              },
            ],
          },
    ),

  renameTrack: (localId, name) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.localId === localId ? { ...t, name } : t)),
    })),

  setTrackModel: (localId, model) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.localId === localId
          ? {
              ...t,
              pedalModelId: model.id,
              // Os blocos e knobs mudam de aparelho para aparelho: as
              // configurações antigas não têm como sobreviver à troca.
              presets: t.presets.map((p) => ({
                ...p,
                settings: createDefaultPresetSettings(model.config),
              })),
            }
          : t,
      ),
    })),

  removeTrack: (localId) =>
    set((s) => ({ tracks: s.tracks.filter((t) => t.localId !== localId) })),

  addPreset: (trackId, model) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.localId === trackId && t.presets.length < MAX_PRESETS_PER_TRACK
          ? {
              ...t,
              presets: [
                ...t.presets,
                makePreset(`Preset ${t.presets.length + 1}`, model),
              ],
            }
          : t,
      ),
    })),

  updatePreset: (trackId, presetId, patch) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.localId === trackId
          ? {
              ...t,
              presets: t.presets.map((p) =>
                p.localId === presetId ? { ...p, ...patch } : p,
              ),
            }
          : t,
      ),
    })),

  removePreset: (trackId, presetId) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.localId === trackId
          ? { ...t, presets: t.presets.filter((p) => p.localId !== presetId) }
          : t,
      ),
    })),

  reset: () => set({ ...initial, tracks: [] }),
}));
