import { z } from "zod";
import { HARD_TEXT_MAX, LIMITS } from "./limits";

export const bandSchema = z.object({
  name: z
    .string()
    .max(HARD_TEXT_MAX, "Nome inválido.")
    .trim()
    .min(2, "O nome da banda precisa de pelo menos 2 caracteres.")
    .max(LIMITS.bandNameMax, `Use no máximo ${LIMITS.bandNameMax} caracteres.`),
});

export const songSchema = z.object({
  bandId: z.string().uuid("Selecione uma banda válida."),
  title: z
    .string()
    .max(HARD_TEXT_MAX, "Nome inválido.")
    .trim()
    .min(1, "Informe o nome da música.")
    .max(LIMITS.songTitleMax, `Use no máximo ${LIMITS.songTitleMax} caracteres.`),
});
