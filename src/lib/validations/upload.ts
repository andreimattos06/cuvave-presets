import { z } from "zod";
import { LIMITS } from "./limits";

// Tetos generosos para o maior painel existente (Tank-G: 7 blocos, 15 knobs) e
// ainda assim baixos o bastante para não deixar um cliente forjado usar
// `settings` como saco de bytes. O que sobra é descartado na sanitização, que
// compara o preset com a config real do modelo.
const MAX_BLOCKS = 32;
const MAX_PARAMS = 32;

const finiteNumber = z.number().finite();

const presetSettingsSchema = z.object({
  blocks: z
    .record(
      z.string().max(64),
      z.object({
        enabled: z.boolean(),
        params: z
          .record(z.string().max(64), finiteNumber)
          .refine((p) => Object.keys(p).length <= MAX_PARAMS, "Preset inválido."),
      }),
    )
    .refine((b) => Object.keys(b).length <= MAX_BLOCKS, "Preset inválido."),
  globalKnobs: z
    .record(z.string().max(64), finiteNumber)
    .refine((k) => Object.keys(k).length <= MAX_PARAMS, "Preset inválido."),
});

/**
 * Uma pedaleira dentro do preset. O mesmo trecho pode ser descrito em mais de
 * um aparelho — ver supabase/migrations/0010_preset_boards.sql.
 */
const boardInputSchema = z.object({
  pedalModelId: z.string().uuid("Escolha a pedaleira desta configuração."),
  settings: presetSettingsSchema,
});

const presetInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome ao preset (ex.: solo, refrão).")
    .max(LIMITS.presetNameMax, `Use no máximo ${LIMITS.presetNameMax} caracteres.`),
  boards: z
    .array(boardInputSchema)
    .min(1, "Cada preset precisa de pelo menos uma pedaleira.")
    .max(
      LIMITS.boardsPerPreset,
      `Um preset aceita no máximo ${LIMITS.boardsPerPreset} pedaleiras.`,
    )
    // A mesma pedaleira duas vezes no mesmo preset não teria como ser exibida:
    // qual das duas seria a configuração boa?
    .refine(
      (boards) => new Set(boards.map((b) => b.pedalModelId)).size === boards.length,
      "Não repita a mesma pedaleira dentro de um preset.",
    ),
});

// A pedaleira pertence ao instrumento, não ao preset: os presets são as
// configurações daquele mesmo aparelho ao longo da música.
const trackInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome ao instrumento (ex.: guitarra principal).")
    .max(LIMITS.trackNameMax, `Use no máximo ${LIMITS.trackNameMax} caracteres.`),
  pedalModelId: z.string().uuid("Escolha a pedaleira deste instrumento."),
  presets: z
    .array(presetInputSchema)
    .min(1, "Cada instrumento precisa de pelo menos um preset.")
    .max(
      LIMITS.presetsPerTrack,
      `Um instrumento aceita no máximo ${LIMITS.presetsPerTrack} presets.`,
    ),
});

export const uploadInputSchema = z.object({
  songId: z.string().uuid("Escolha a música."),
  title: z
    .string()
    .trim()
    .min(LIMITS.uploadTitleMin, "Dê um nome ao envio (ex.: versão do álbum).")
    .max(LIMITS.uploadTitleMax, `Use no máximo ${LIMITS.uploadTitleMax} caracteres.`),
  note: z
    .string()
    .trim()
    .max(LIMITS.uploadNoteMax, `Use no máximo ${LIMITS.uploadNoteMax} caracteres.`)
    .optional(),
  tracks: z
    .array(trackInputSchema)
    .min(1, "Adicione pelo menos um instrumento.")
    .max(
      LIMITS.tracksPerUpload,
      `São no máximo ${LIMITS.tracksPerUpload} instrumentos por envio.`,
    ),
});

export type UploadInput = z.infer<typeof uploadInputSchema>;
