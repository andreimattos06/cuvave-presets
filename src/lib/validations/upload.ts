import { z } from "zod";

const presetSettingsSchema = z.object({
  blocks: z.record(
    z.string(),
    z.object({
      enabled: z.boolean(),
      params: z.record(z.string(), z.number()),
    }),
  ),
  globalKnobs: z.record(z.string(), z.number()),
});

export const presetInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome ao preset (ex.: solo, refrão).")
    .max(40, "Use no máximo 40 caracteres."),
  settings: presetSettingsSchema,
});

// A pedaleira pertence ao instrumento, não ao preset: os presets são as
// configurações daquele mesmo aparelho ao longo da música.
export const trackInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome ao instrumento (ex.: guitarra principal).")
    .max(60, "Use no máximo 60 caracteres."),
  pedalModelId: z.string().uuid("Escolha a pedaleira deste instrumento."),
  presets: z
    .array(presetInputSchema)
    .min(1, "Cada instrumento precisa de pelo menos um preset.")
    .max(8, "Um instrumento aceita no máximo 8 presets."),
});

export const uploadInputSchema = z.object({
  songId: z.string().uuid("Escolha a música."),
  title: z
    .string()
    .trim()
    .min(3, "Dê um nome ao envio (ex.: versão do álbum).")
    .max(80, "Use no máximo 80 caracteres."),
  note: z.string().trim().max(400, "Use no máximo 400 caracteres.").optional(),
  tracks: z
    .array(trackInputSchema)
    .min(1, "Adicione pelo menos um instrumento.")
    .max(10, "São no máximo 10 instrumentos por envio."),
});

export type UploadInput = z.infer<typeof uploadInputSchema>;
