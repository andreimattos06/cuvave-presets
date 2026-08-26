"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { z } from "zod";

export type VoteResult = { ok: boolean; message?: string };

/**
 * Aprova (1) ou reprova (-1) um envio. Votar de novo no mesmo sentido desfaz o
 * voto — é o comportamento que as pessoas esperam de um botão de aprovação.
 * A unique(upload_id, user_id) garante um voto por pessoa mesmo com corrida.
 */
export async function voteUpload(
  uploadId: string,
  value: 1 | -1,
  pathToRevalidate?: string,
): Promise<VoteResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Entre na sua conta para avaliar envios." };
  }

  // Os argumentos vêm de um componente cliente: nada garante que sejam o que a
  // assinatura promete.
  if (!z.string().uuid().safeParse(uploadId).success || (value !== 1 && value !== -1)) {
    return { ok: false, message: "Envio inválido." };
  }

  const verdict = await consumeRateLimit("vote", `user:${user.id}`);
  if (!verdict.ok) {
    return {
      ok: false,
      message: rateLimitMessage(verdict.retryAfter, "Muitos votos seguidos."),
    };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("upload_id", uploadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.value === value) {
    const { error } = await supabase.from("votes").delete().eq("id", existing.id);
    if (error) return { ok: false, message: "Não foi possível remover seu voto." };
  } else if (existing) {
    const { error } = await supabase
      .from("votes")
      .update({ value })
      .eq("id", existing.id);
    if (error) return { ok: false, message: "Não foi possível atualizar seu voto." };
  } else {
    const { error } = await supabase
      .from("votes")
      .insert({ upload_id: uploadId, user_id: user.id, value });
    if (error) return { ok: false, message: "Não foi possível registrar seu voto." };
  }

  if (pathToRevalidate) revalidatePath(pathToRevalidate);
  return { ok: true };
}
