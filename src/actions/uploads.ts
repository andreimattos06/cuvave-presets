"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadInputSchema } from "@/lib/validations/upload";
import {
  consumeRateLimit,
  consumeRateLimits,
  getClientIp,
  isQuotaError,
  rateLimitMessage,
} from "@/lib/rate-limit";
import { sanitizePresetSettings, type PedalModelConfig } from "@/types/pedal";
import { isPedalAvailable } from "@/lib/pedals/availability";
import { z } from "zod";
import type { Json } from "@/types/database";

export type SubmitUploadResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string };

type UploadInput = z.infer<typeof uploadInputSchema>;

/**
 * Traduz o erro do banco. Os limites de árvore (8 presets, 10 instrumentos,
 * 4 pedaleiras) vivem em triggers, e é de lá que a mensagem tem de vir — o
 * cliente pode ter sido forjado e passado por cima do formulário.
 */
function writeErrorMessage(error: { code?: string; message: string }) {
  if (isQuotaError(error)) {
    return "Você já enviou muitos presets hoje. Tente de novo amanhã.";
  }
  if (error.message.includes("máximo 8")) {
    return "Um instrumento passou do limite de 8 presets.";
  }
  if (error.message.includes("máximo 10")) {
    return "O envio passou do limite de 10 instrumentos.";
  }
  if (error.message.includes("máximo 4")) {
    return "Um preset passou do limite de 4 pedaleiras.";
  }
  return "Não foi possível salvar o envio. Tente novamente.";
}

/**
 * Confere as pedaleiras usadas e devolve a árvore no formato das funções
 * create_upload/update_upload, com cada configuração já sanitizada contra o
 * painel real do modelo dela.
 *
 * O filtro de disponibilidade vale aqui também: a lista do formulário some para
 * o usuário, mas um cliente forjado ainda mandaria o id de um modelo escondido.
 */
async function buildTracksPayload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: UploadInput,
): Promise<{ ok: true; tracks: Json } | { ok: false; message: string }> {
  const modelIds = [
    ...new Set(
      input.tracks.flatMap((track) => [
        track.pedalModelId,
        ...track.presets.flatMap((preset) => preset.boards.map((b) => b.pedalModelId)),
      ]),
    ),
  ];

  const { data: models } = await supabase
    .from("pedal_models")
    .select("id, slug, config")
    .in("id", modelIds);

  const configById = new Map(
    (models ?? [])
      .filter((m) => isPedalAvailable(m.slug))
      .map((m) => [m.id, m.config as PedalModelConfig]),
  );

  if (configById.size !== modelIds.length) {
    return { ok: false, message: "Escolha uma pedaleira válida em cada preset." };
  }

  return {
    ok: true,
    tracks: input.tracks.map((track) => ({
      name: track.name,
      pedal_model_id: track.pedalModelId,
      presets: track.presets.map((preset) => ({
        name: preset.name,
        boards: preset.boards.map((board) => ({
          pedal_model_id: board.pedalModelId,
          settings: sanitizePresetSettings(
            configById.get(board.pedalModelId)!,
            board.settings,
          ),
        })),
      })),
    })),
  };
}

/**
 * Grava um envio inteiro (instrumentos + presets + pedaleiras) de uma vez, via
 * função create_upload — ver supabase/migrations/0010_preset_boards.sql.
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

  const verdict = await consumeRateLimits([
    { action: "upload", scope: `user:${user.id}` },
    { action: "uploadDay", scope: `user:${user.id}` },
    { action: "uploadIp", scope: `ip:${await getClientIp()}` },
  ]);
  if (!verdict.ok) {
    return {
      ok: false,
      message: rateLimitMessage(verdict.retryAfter, "Muitos envios seguidos."),
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

  const payload = await buildTracksPayload(supabase, parsed.data);
  if (!payload.ok) return payload;

  const { data: uploadId, error } = await supabase.rpc("create_upload", {
    p_song_id: parsed.data.songId,
    p_title: parsed.data.title,
    p_note: parsed.data.note ?? null,
    p_tracks: payload.tracks,
  });

  if (error) return { ok: false, message: writeErrorMessage(error) };

  const songPath = `/bandas/${song.band?.slug}/${song.slug}`;
  revalidatePath(songPath);
  revalidatePath("/perfil");

  return { ok: true, redirectTo: `${songPath}/${uploadId}` };
}

/**
 * Reescreve um envio que já existe. A checagem de dono está na função do banco;
 * aqui ela é repetida só para a mensagem sair amigável em vez de crua.
 */
export async function updateUpload(
  uploadId: string,
  input: unknown,
): Promise<SubmitUploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Entre na sua conta para editar presets." };
  }
  if (!z.string().uuid().safeParse(uploadId).success) {
    return { ok: false, message: "Envio não encontrado." };
  }

  const parsed = uploadInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revise os dados do envio.",
    };
  }

  // Editar é mais barato que enviar (não cria linha nova em uploads), mas
  // continua sendo escrita: sem teto, um laço de edição serve de martelo.
  const verdict = await consumeRateLimits([
    { action: "upload", scope: `user:${user.id}` },
    { action: "uploadIp", scope: `ip:${await getClientIp()}` },
  ]);
  if (!verdict.ok) {
    return {
      ok: false,
      message: rateLimitMessage(verdict.retryAfter, "Muitas edições seguidas."),
    };
  }

  const supabase = await createClient();

  const { data: upload } = await supabase
    .from("uploads")
    .select("id, user_id, song:songs ( slug, band:bands ( slug ) )")
    .eq("id", uploadId)
    .maybeSingle();

  if (!upload || upload.user_id !== user.id) {
    return { ok: false, message: "Envio não encontrado." };
  }

  const payload = await buildTracksPayload(supabase, parsed.data);
  if (!payload.ok) return payload;

  const { error } = await supabase.rpc("update_upload", {
    p_upload_id: uploadId,
    p_title: parsed.data.title,
    p_note: parsed.data.note ?? null,
    p_tracks: payload.tracks,
  });

  if (error) return { ok: false, message: writeErrorMessage(error) };

  const songPath = `/bandas/${upload.song?.band?.slug}/${upload.song?.slug}`;
  revalidatePath(songPath);
  revalidatePath(`${songPath}/${uploadId}`);
  revalidatePath("/perfil");

  return { ok: true, redirectTo: `${songPath}/${uploadId}` };
}

/**
 * Apaga um envio do próprio usuário. Instrumentos, presets, pedaleiras e votos
 * saem em cascata pelas foreign keys; a RLS (uploads_delete_own) é quem garante
 * que ninguém apague o envio dos outros.
 */
export async function deleteUpload(
  uploadId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Entre na sua conta para apagar um envio." };
  }
  if (!z.string().uuid().safeParse(uploadId).success) {
    return { ok: false, message: "Envio não encontrado." };
  }

  const supabase = await createClient();

  const { data: upload } = await supabase
    .from("uploads")
    .select("id, user_id, song:songs ( slug, band:bands ( slug ) )")
    .eq("id", uploadId)
    .maybeSingle();

  if (!upload || upload.user_id !== user.id) {
    return { ok: false, message: "Envio não encontrado." };
  }

  const { error } = await supabase.from("uploads").delete().eq("id", uploadId);
  if (error) {
    return { ok: false, message: "Não foi possível apagar o envio." };
  }

  revalidatePath(`/bandas/${upload.song?.band?.slug}/${upload.song?.slug}`);
  revalidatePath("/perfil");
  return { ok: true };
}

/**
 * Contabiliza uma visualização. Fica numa action (e não no render da página)
 * porque o prefetch do Next busca a rota antes de qualquer clique — contar ali
 * inflaria o número. Aqui só roda quando a página realmente monta no navegador.
 */
export async function registerUploadView(uploadId: string) {
  if (!z.string().uuid().safeParse(uploadId).success) return;

  // Um mesmo visitante recarregando a página não vira audiência: o teto é por
  // IP e por envio.
  const ip = await getClientIp();
  const verdict = await consumeRateLimit("view", `${ip}:${uploadId}`);
  if (!verdict.ok) return;

  const supabase = await createClient();
  await supabase.rpc("increment_upload_views", { p_upload_id: uploadId });
}
