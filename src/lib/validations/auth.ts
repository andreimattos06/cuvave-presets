import { z } from "zod";
import { HARD_TEXT_MAX, LIMITS } from "./limits";

/**
 * Regras exibidas ao vivo no formulário e reaproveitadas pelos schemas do
 * servidor — assim o checklist do cliente nunca discorda do que o server valida.
 */
export type FieldRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const USERNAME_RULES: FieldRule[] = [
  {
    id: "length",
    label: `De ${LIMITS.usernameMin} a ${LIMITS.usernameMax} caracteres`,
    test: (v) =>
      v.trim().length >= LIMITS.usernameMin && v.trim().length <= LIMITS.usernameMax,
  },
  {
    id: "charset",
    label: "Só letras, números, hífen e underscore",
    test: (v) => /^[a-zA-Z0-9_-]+$/.test(v.trim()),
  },
];

export const PASSWORD_RULES: FieldRule[] = [
  {
    id: "length",
    label: `De ${LIMITS.passwordMin} a ${LIMITS.passwordMax} caracteres`,
    test: (v) => v.length >= LIMITS.passwordMin && v.length <= LIMITS.passwordMax,
  },
  { id: "letter", label: "Pelo menos uma letra", test: (v) => /\p{L}/u.test(v) },
  { id: "number", label: "Pelo menos um número", test: (v) => /\d/.test(v) },
];

const EMAIL_SHAPE = /^[^\s@,;]+@[^\s@,;]+$/;

/**
 * Diz exatamente o que falta no e-mail em vez de um "e-mail inválido" genérico:
 * o campo precisa de nome, @, provedor e uma terminação depois do ponto.
 * Retorna `null` quando está tudo certo.
 */
export function emailIssue(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Informe seu e-mail.";
  if (value.length > LIMITS.emailMax)
    return `O e-mail passa de ${LIMITS.emailMax} caracteres.`;

  const at = value.split("@");
  if (at.length === 1) return "Falta o @ (ex.: voce@gmail.com).";
  if (at.length > 2) return "O e-mail só pode ter um @.";

  const [local, domain] = at;
  if (!local) return "Falta o nome antes do @.";
  if (local.length > LIMITS.emailLocalMax)
    return `O nome antes do @ passa de ${LIMITS.emailLocalMax} caracteres.`;
  if (!domain) return "Falta o provedor depois do @ (ex.: gmail.com).";
  if (domain.length > LIMITS.emailDomainMax)
    return "O domínio do e-mail é longo demais.";
  if (!domain.includes(".")) return "Falta o ponto do domínio (ex.: .com).";
  if (domain.startsWith(".") || domain.endsWith("."))
    return "O domínio não pode começar nem terminar com ponto.";

  const tld = domain.split(".").pop() ?? "";
  if (!/^[a-zA-Z]{2,}$/.test(tld))
    return "A terminação do domínio está incompleta (ex.: .com, .com.br).";
  if (!EMAIL_SHAPE.test(value) || /\.\./.test(value))
    return "Esse e-mail tem caracteres que não são aceitos.";

  return null;
}

/** Aplica uma lista de FieldRule como issues do zod, na mesma ordem do checklist. */
function withRules(rules: FieldRule[]) {
  return (value: string, ctx: z.RefinementCtx) => {
    for (const rule of rules) {
      if (!rule.test(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: rule.label });
        return;
      }
    }
  };
}

const emailField = z
  .string()
  .max(HARD_TEXT_MAX, "E-mail inválido.")
  .trim()
  .superRefine((value, ctx) => {
    const issue = emailIssue(value);
    if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue });
  });

const passwordField = z
  .string()
  .max(HARD_TEXT_MAX, `Use no máximo ${LIMITS.passwordMax} caracteres.`)
  .superRefine(withRules(PASSWORD_RULES));

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, "Informe sua senha.")
    .max(HARD_TEXT_MAX, "Senha inválida."),
});

export const signupSchema = z
  .object({
    username: z
      .string()
      .max(HARD_TEXT_MAX, "Nome de usuário inválido.")
      .trim()
      .superRefine(withRules(USERNAME_RULES)),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().max(HARD_TEXT_MAX),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().max(HARD_TEXT_MAX),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
