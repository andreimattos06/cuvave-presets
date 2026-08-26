"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { bandSchema, songSchema } from "@/lib/validations/catalog";
import type { ActionState } from "@/lib/action-state";
import { consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";

/**
 * Cadastro colaborativo do catálogo: qualquer usuário logado pode criar uma
 * banda ou música que ainda não exista (as RLS exigem created_by = auth.uid()).
 */

export type CreatedBand = ActionState & { band?: { id: string; slug: string; name: string } };

export async function createBand(
  _prevState: ActionState,
  formData: FormData,
): Promise<CreatedBand> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Entre na sua conta para cadastrar bandas." };
  }

  const parsed = bandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const limited = await consumeRateLimit("catalogWrite", `user:${user.id}`);
  if (!limited.ok) {
    return {
      status: "error",
      message: rateLimitMessage(limited.retryAfter, "Muitos cadastros seguidos."),
    };
  }

  const supabase = await createClient();
  const slug = slugify(parsed.data.name);

  // Banda já cadastrada por outra pessoa: reaproveita em vez de duplicar.
  const { data: existing } = await supabase
    .from("bands")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return {
      status: "success",
      message: "Essa banda já estava no catálogo.",
      band: existing,
    };
  }

  const { data, error } = await supabase
    .from("bands")
    .insert({ name: parsed.data.name, slug, created_by: user.id })
    .select("id, slug, name")
    .single();

  if (error) {
    return { status: "error", message: "Não foi possível cadastrar a banda." };
  }

  revalidatePath("/bandas");
  return { status: "success", message: "Banda cadastrada!", band: data };
}

export type CreatedSong = ActionState & { song?: { id: string; slug: string; title: string } };

export async function createSong(
  _prevState: ActionState,
  formData: FormData,
): Promise<CreatedSong> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Entre na sua conta para cadastrar músicas." };
  }

  const parsed = songSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const limited = await consumeRateLimit("catalogWrite", `user:${user.id}`);
  if (!limited.ok) {
    return {
      status: "error",
      message: rateLimitMessage(limited.retryAfter, "Muitos cadastros seguidos."),
    };
  }

  const supabase = await createClient();
  const slug = slugify(parsed.data.title);

  const { data: existing } = await supabase
    .from("songs")
    .select("id, slug, title")
    .eq("band_id", parsed.data.bandId)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return {
      status: "success",
      message: "Essa música já estava no catálogo.",
      song: existing,
    };
  }

  const { data, error } = await supabase
    .from("songs")
    .insert({
      band_id: parsed.data.bandId,
      title: parsed.data.title,
      slug,
      created_by: user.id,
    })
    .select("id, slug, title")
    .single();

  if (error) {
    return { status: "error", message: "Não foi possível cadastrar a música." };
  }

  revalidatePath("/bandas");
  return { status: "success", message: "Música cadastrada!", song: data };
}
