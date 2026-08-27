import { create } from "zustand";
import type { PedalModel, PresetSettings } from "@/types/pedal";
import { createDefaultPresetSettings } from "@/types/pedal";
import { LIMITS } from "@/lib/validations/limits";

export const MAX_PRESETS_PER_TRACK = LIMITS.presetsPerTrack;
export const MAX_TRACKS_PER_UPLOAD = LIMITS.tracksPerUpload;
export const MAX_BOARDS_PER_PRESET = LIMITS.boardsPerPreset;

/** A configuração de uma pedaleira dentro de um preset. */
export type WizardBoard = {
  localId: string;
  pedalModelId: string;
  settings: PresetSettings;
};

export type WizardPreset = {
  localId: string;
  name: string;
  /** O mesmo trecho descrito em uma ou mais pedaleiras. */
  boards: WizardBoard[];
};

export type WizardTrack = {
  localId: string;
  name: string;
  /**
   * Pedaleiras deste instrumento. A primeira é a principal (é ela que vai para
   * `tracks.pedal_model_id`); todos os presets da faixa ganham um board de cada
   * uma, para o envio ficar completo em qualquer aparelho que a pessoa escolheu.
   */
  pedalModelIds: string[];
  presets: WizardPreset[];
};

/** Semente vinda do banco quando o wizard abre para editar um envio. */
export type WizardSeed = {
  uploadId: string;
  title: string;
  note: string;
  song: { id: string; title: string };
  band: { id: string; name: string };
  tracks: {
    name: string;
    pedalModelId: string;
    presets: { name: string; boards: { pedalModelId: string; settings: PresetSettings }[] }[];
  }[];
};

type WizardState = {
  step: number;
  /** Vazio no envio novo; preenchido quando o wizard está editando. */
  editingUploadId: string;
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
  setTrackModels: (localId: string, models: PedalModel[]) => void;
  removeTrack: (localId: string) => void;

  addPreset: (trackId: string, models: PedalModel[]) => void;
  updatePreset: (
    trackId: string,
    presetId: string,
    patch: Partial<Omit<WizardPreset, "localId">>,
  ) => void;
  setBoardSettings: (
    trackId: string,
    presetId: string,
    boardId: string,
    settings: PresetSettings,
  ) => void;
  removePreset: (trackId: string, presetId: string) => void;

  hydrate: (seed: WizardSeed) => void;
  reset: () => void;
};

const uid = () => crypto.randomUUID();

function makeBoard(model: PedalModel): WizardBoard {
  return {
    localId: uid(),
    pedalModelId: model.id,
    settings: createDefaultPresetSettings(model.config),
  };
}

function makePreset(name: string, models: PedalModel[]): WizardPreset {
  return { localId: uid(), name, boards: models.map(makeBoard) };
}

/**
 * Reencaixa os boards de um preset na nova lista de pedaleiras do instrumento:
 * quem continua na lista mantém os knobs como estavam, quem entrou começa no
 * padrão de fábrica e quem saiu some.
 */
function syncBoards(preset: WizardPreset, models: PedalModel[]): WizardPreset {
  const byModel = new Map(preset.boards.map((b) => [b.pedalModelId, b]));
  return {
    ...preset,
    boards: models.map((model) => byModel.get(model.id) ?? makeBoard(model)),
  };
}

const initial = {
  step: 0,
  editingUploadId: "",
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
                pedalModelIds: [model.id],
                presets: [makePreset("Base", [model])],
              },
            ],
          },
    ),

  renameTrack: (localId, name) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.localId === localId ? { ...t, name } : t)),
    })),

  setTrackModels: (localId, models) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.localId === localId && models.length > 0
          ? {
              ...t,
              pedalModelIds: models.map((m) => m.id),
              presets: t.presets.map((p) => syncBoards(p, models)),
            }
          : t,
      ),
    })),

  removeTrack: (localId) =>
    set((s) => ({ tracks: s.tracks.filter((t) => t.localId !== localId) })),

  addPreset: (trackId, models) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.localId === trackId && t.presets.length < MAX_PRESETS_PER_TRACK
          ? {
              ...t,
              presets: [
                ...t.presets,
                makePreset(`Preset ${t.presets.length + 1}`, models),
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

  setBoardSettings: (trackId, presetId, boardId, settings) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.localId === trackId
          ? {
              ...t,
              presets: t.presets.map((p) =>
                p.localId === presetId
                  ? {
                      ...p,
                      boards: p.boards.map((b) =>
                        b.localId === boardId ? { ...b, settings } : b,
                      ),
                    }
                  : p,
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

  hydrate: (seed) =>
    set({
      ...initial,
      editingUploadId: seed.uploadId,
      bandId: seed.band.id,
      bandName: seed.band.name,
      songId: seed.song.id,
      songTitle: seed.song.title,
      title: seed.title,
      note: seed.note,
      // Os ids locais são criados agora: o que veio do banco tem id de banco, e
      // misturar os dois faria a edição reaproveitar chaves do React à toa.
      tracks: seed.tracks.map((track) => ({
        localId: uid(),
        name: track.name,
        pedalModelIds: [
          ...new Set([
            track.pedalModelId,
            ...track.presets.flatMap((p) => p.boards.map((b) => b.pedalModelId)),
          ]),
        ],
        presets: track.presets.map((preset) => ({
          localId: uid(),
          name: preset.name,
          boards: preset.boards.map((board) => ({
            localId: uid(),
            pedalModelId: board.pedalModelId,
            settings: board.settings,
          })),
        })),
      })),
    }),

  reset: () => set({ ...initial, tracks: [] }),
}));
