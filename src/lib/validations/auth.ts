import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const signupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Mínimo de 3 caracteres.")
      .max(24, "Máximo de 24 caracteres.")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Use apenas letras, números, hífen e underscore.",
      ),
    email: z.string().trim().email("Informe um e-mail válido."),
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
