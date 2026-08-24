import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PedalModelConfig, PresetSettings } from "@/types/pedal";

/** Leituras públicas do catálogo — funcionam com ou sem sessão (RLS libera SELECT). */

export async function listBands(query?: string) {
  const supabase = await createClient();
  let request = supabase
    .from("bands")
    .select("id, name, slug, cover_url, songs(count)")
    .order("name");

  if (query?.trim()) {
    request = request.ilike("name", `%${query.trim()}%`);
  }

  const { data, error } = await request;
  if (error) throw error;

  return (data ?? []).map((band) => ({
    ...band,
    songCount: band.songs?.[0]?.count ?? 0,
  }));
}

export async function getBandBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bands")
    .select("id, name, slug, cover_url, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listSongsByBand(bandId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id, title, slug, created_at, uploads(count)")
    .eq("band_id", bandId)
    .order("title");

  if (error) throw error;

  return (data ?? []).map((song) => ({
    ...song,
    uploadCount: song.uploads?.[0]?.count ?? 0,
  }));
}

export async function getSongBySlug(bandId: string, songSlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id, title, slug, created_at")
    .eq("band_id", bandId)
    .eq("slug", songSlug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type SongUpload = {
  id: string;
  title: string;
  note: string | null;
  views: number;
  created_at: string;
  author: { id: string; username: string; avatar_url: string | null } | null;
  score: number;
  approvals: number;
  disapprovals: number;
  myVote: 1 | -1 | null;
  tracks: {
    id: string;
    name: string;
    position: number;
    /** Uma pedaleira por instrumento; os presets abaixo são todos dela. */
    pedalModel: { id: string; name: string; slug: string; config: PedalModelConfig };
    presets: {
      id: string;
      name: string;
      position: number;
      settings: PresetSettings;
    }[];
  }[];
};

/**
 * Uploads de uma música com faixas, presets e placar, já ordenados por
 * aprovação (score desc, mais antigo primeiro em caso de empate).
 *
 * O placar vem separado porque a view `upload_scores` agrega sobre `votes` e,
 * portanto, não lista uploads que ainda não receberam nenhum voto.
 */
export async function listUploadsForSong(
  songId: string,
  viewerId?: string,
): Promise<SongUpload[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("uploads")
    .select(
      `id, title, note, views, created_at,
       author:profiles ( id, username, avatar_url ),
       tracks ( id, name, position,
         pedalModel:pedal_models ( id, name, slug, config ),
         presets ( id, name, position, settings ) )`,
    )
    .eq("song_id", songId);

  if (error) throw error;
  const uploads = data ?? [];
  if (uploads.length === 0) return [];

  const ids = uploads.map((u) => u.id);

  const [{ data: scores }, myVotes] = await Promise.all([
    supabase.from("upload_scores").select("*").in("upload_id", ids),
    viewerId
      ? supabase
          .from("votes")
          .select("upload_id, value")
          .eq("user_id", viewerId)
          .in("upload_id", ids)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
  ]);

  const scoreById = new Map((scores ?? []).map((s) => [s.upload_id, s]));
  const voteById = new Map(myVotes.map((v) => [v.upload_id, v.value]));

  return uploads
    .map((upload) => {
      const score = scoreById.get(upload.id);
      return {
        ...upload,
        author: upload.author,
        score: score?.score ?? 0,
        approvals: score?.approvals ?? 0,
        disapprovals: score?.disapprovals ?? 0,
        myVote: voteById.get(upload.id) ?? null,
        tracks: [...upload.tracks]
          .sort((a, b) => a.position - b.position)
          .map((track) => ({
            ...track,
            presets: [...track.presets].sort((a, b) => a.position - b.position),
          })),
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
}

/** Um envio isolado, com a árvore completa — página /bandas/[slug]/[musica]/[upload]. */
export async function getUploadById(
  uploadId: string,
  viewerId?: string,
): Promise<SongUpload | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("uploads")
    .select(
      `id, title, note, views, created_at,
       author:profiles ( id, username, avatar_url ),
       tracks ( id, name, position,
         pedalModel:pedal_models ( id, name, slug, config ),
         presets ( id, name, position, settings ) )`,
    )
    .eq("id", uploadId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [{ data: score }, myVote] = await Promise.all([
    supabase
      .from("upload_scores")
      .select("*")
      .eq("upload_id", uploadId)
      .maybeSingle(),
    viewerId
      ? supabase
          .from("votes")
          .select("value")
          .eq("user_id", viewerId)
          .eq("upload_id", uploadId)
          .maybeSingle()
          .then((r) => r.data?.value ?? null)
      : Promise.resolve(null),
  ]);

  return {
    ...data,
    score: score?.score ?? 0,
    approvals: score?.approvals ?? 0,
    disapprovals: score?.disapprovals ?? 0,
    myVote,
    tracks: [...data.tracks]
      .sort((a, b) => a.position - b.position)
      .map((track) => ({
        ...track,
        presets: [...track.presets].sort((a, b) => a.position - b.position),
      })),
  };
}

/** Destaques da home: uploads mais aprovados, com música e banda. */
export async function listTopUploads(limit = 6) {
  const supabase = await createClient();

  const { data: scores, error } = await supabase
    .from("upload_scores")
    .select("upload_id, score, approvals")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!scores?.length) return [];

  const { data, error: uploadsError } = await supabase
    .from("uploads")
    .select(
      `id, title, views, created_at,
       author:profiles ( username ),
       song:songs ( title, slug, band:bands ( name, slug ) )`,
    )
    .in("id", scores.map((s) => s.upload_id));

  if (uploadsError) throw uploadsError;

  const scoreById = new Map(scores.map((s) => [s.upload_id, s]));
  return (data ?? [])
    .map((upload) => ({
      ...upload,
      score: scoreById.get(upload.id)?.score ?? 0,
      approvals: scoreById.get(upload.id)?.approvals ?? 0,
    }))
    .sort((a, b) => b.score - a.score);
}

/** Envios de um usuário, do mais aprovado ao menos aprovado (perfil). */
export async function listUploadsByUser(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("uploads")
    .select(
      `id, title, note, views, created_at,
       song:songs ( title, slug, band:bands ( name, slug ) ),
       tracks ( id, presets ( id ) )`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const uploads = data ?? [];
  if (uploads.length === 0) return [];

  const { data: scores } = await supabase
    .from("upload_scores")
    .select("upload_id, score, approvals, disapprovals")
    .in("upload_id", uploads.map((u) => u.id));

  const scoreById = new Map((scores ?? []).map((s) => [s.upload_id, s]));

  return uploads
    .map((upload) => ({
      ...upload,
      score: scoreById.get(upload.id)?.score ?? 0,
      approvals: scoreById.get(upload.id)?.approvals ?? 0,
      disapprovals: scoreById.get(upload.id)?.disapprovals ?? 0,
      trackCount: upload.tracks.length,
      presetCount: upload.tracks.reduce((sum, t) => sum + t.presets.length, 0),
    }))
    .sort((a, b) => b.score - a.score);
}

export type CatalogHit = {
  kind: "band" | "song";
  id: string;
  title: string;
  slug: string;
  band_name: string;
  band_slug: string;
  uploads_count: number;
  relevance: number;
};

/**
 * Busca única por banda e música, ordenada por relevância (similaridade
 * trigram, com bônus para quem começa com o termo) — ver a função
 * search_catalog em supabase/migrations/0003_upload_shape.sql.
 */
export async function searchCatalogRanked(
  query: string,
  limit = 20,
): Promise<CatalogHit[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_catalog", {
    p_query: term,
    p_limit: limit,
  });

  if (error) throw error;
  return data ?? [];
}

export async function listPedalModels() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedal_models")
    .select("id, name, slug, config")
    .order("name");

  if (error) throw error;
  return data ?? [];
}
