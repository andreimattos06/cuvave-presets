"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/supabase/errors";
import { getOrigin, safeNextPath } from "@/lib/url";
import type { ActionState } from "@/lib/action-state";
import { consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Dois contadores: um segura o martelo vindo de um IP, o outro impede que
  // uma botnet distribuída fique tentando senhas numa conta específica.
  for (const scope of [undefined, `email:${parsed.data.email.toLowerCase()}`]) {
    const verdict = await consumeRateLimit("login", scope);
    if (!verdict.ok) {
      return {
        status: "error",
        message: rateLimitMessage(
          verdict.retryAfter,
          "Muitas tentativas de login.",
        ),
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  // Volta para a página que exigiu login (o proxy grava em ?next=).
  redirect(safeNextPath(formData.get("next")));
}

export async function signup(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const verdict = await consumeRateLimit("signup");
  if (!verdict.ok) {
    return {
      status: "error",
      message: rateLimitMessage(
        verdict.retryAfter,
        "Muitas contas criadas a partir daqui.",
      ),
    };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.username },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(safeNextPath(formData.get("next")));
  }

  return {
    status: "success",
    message: `Quase lá! Enviamos um link de confirmação para ${parsed.data.email}. Abra o e-mail e clique em "Confirmar meu e-mail" para ativar a conta — se não aparecer em alguns minutos, olhe no spam.`,
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe um e-mail válido.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // A resposta é sempre a mesma, mesmo bloqueado: dizer "muitas tentativas"
  // só para e-mails cadastrados entregaria quem tem conta.
  const [byIp, byEmail] = await Promise.all([
    consumeRateLimit("passwordRecovery"),
    consumeRateLimit("passwordRecovery", `email:${parsed.data.email.toLowerCase()}`),
  ]);

  if (byIp.ok && byEmail.ok) {
    const origin = await getOrigin();
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
    });
  }

  // Mensagem genérica de propósito: evita confirmar quais e-mails têm conta.
  return {
    status: "success",
    message:
      "Se existir uma conta com esse e-mail, enviamos um link de recuperação.",
  };
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const verdict = await consumeRateLimit("passwordUpdate");
  if (!verdict.ok) {
    return { status: "error", message: rateLimitMessage(verdict.retryAfter) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
