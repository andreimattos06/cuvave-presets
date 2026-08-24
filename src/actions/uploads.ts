"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadInputSchema } from "@/lib/validations/upload";

export type SubmitUploadResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string };

/**
 * Grava um envio inteiro (instrumentos + presets) de uma vez, via função
 * create_upload — ver supabase/migrations/0003_upload_shape.sql.
 */
export async function submitUpload(input: unknown): Promise<SubmitUploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Entre na sua conta para enviar presets." };
  }

  const parsed = uploadInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revise os dados do envio.",
    };
  }

  const supabase = await createClient();

  const { data: song, error: songError } = await supabase
    .from("songs")
    .select("id, slug, band:bands ( slug )")
    .eq("id", parsed.data.songId)
    .maybeSingle();

  if (songError || !song) {
    return { ok: false, message: "Música não encontrada." };
  }

  const { data: uploadId, error } = await supabase.rpc("create_upload", {
    p_song_id: parsed.data.songId,
    p_title: parsed.data.title,
    p_note: parsed.data.note ?? null,
    p_tracks: parsed.data.tracks.map((track) => ({
      name: track.name,
      pedal_model_id: track.pedalModelId,
      presets: track.presets.map((preset) => ({
        name: preset.name,
        settings: preset.settings,
      })),
    })),
  });

  if (error) {
    return {
      ok: false,
      message: error.message.includes("máximo 8")
        ? "Um instrumento passou do limite de 8 presets."
        : error.message.includes("máximo 10")
          ? "O envio passou do limite de 10 instrumentos."
          : "Não foi possível salvar o envio. Tente novamente.",
    };
  }

  const songPath = `/bandas/${song.band?.slug}/${song.slug}`;
  revalidatePath(songPath);
  revalidatePath("/perfil");

  return { ok: true, redirectTo: `${songPath}/${uploadId}` };
}

/**
 * Contabiliza uma visualização. Fica numa action (e não no render da página)
 * porque o prefetch do Next busca a rota antes de qualquer clique — contar ali
 * inflaria o número. Aqui só roda quando a página realmente monta no navegador.
 */
export async function registerUploadView(uploadId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_upload_views", { p_upload_id: uploadId });
}
