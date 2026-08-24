import { z } from "zod";

export const bandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome da banda precisa de pelo menos 2 caracteres.")
    .max(80, "Use no máximo 80 caracteres."),
});

export const songSchema = z.object({
  bandId: z.string().uuid("Selecione uma banda válida."),
  title: z
    .string()
    .trim()
    .min(1, "Informe o nome da música.")
    .max(120, "Use no máximo 120 caracteres."),
});
