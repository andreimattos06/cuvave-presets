import "server-only";
import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/validations/limits";
import type { PedalModelConfig, PresetSettings } from "@/types/pedal";
import { AVAILABLE_PEDAL_SLUGS } from "@/lib/pedals/availability";

/** Leituras públicas do catálogo — funcionam com ou sem sessão (RLS libera SELECT). */

export async function listBands(query?: string) {
  const supabase = await createClient();
  let request = supabase
    .from("bands")
    .select("id, name, slug, cover_url, songs(count)")
    .order("name");

  const term = query?.trim().slice(0, LIMITS.searchQueryMax);
  if (term) {
    request = request.ilike("name", `%${term}%`);
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
  updated_at: string;
  tracks: {
    id: string;
    name: string;
    position: number;
    /** Pedaleira principal do instrumento — semeia os presets novos. */
    pedalModel: PedalModelRef;
    presets: {
      id: string;
      name: string;
      position: number;
      /** Uma configuração por pedaleira: o mesmo trecho em aparelhos diferentes. */
      boards: PresetBoard[];
    }[];
  }[];
};

export type PedalModelRef = {
  id: string;
  name: string;
  slug: string;
  config: PedalModelConfig;
};

export type PresetBoard = {
  id: string;
  position: number;
  settings: PresetSettings;
  pedalModel: PedalModelRef;
};

/**
 * O PostgREST devolve os filhos na ordem que o Postgres entregar, que não é
 * ordem nenhuma. A posição é o que o autor escolheu — ordena instrumentos,
 * presets e pedaleiras por ela antes de qualquer coisa chegar à tela.
 */
function sortTracks<
  T extends {
    position: number;
    presets: { position: number; boards: { position: number }[] }[];
  },
>(tracks: T[]) {
  return [...tracks]
    .sort((a, b) => a.position - b.position)
    .map((track) => ({
      ...track,
      presets: [...track.presets]
        .sort((a, b) => a.position - b.position)
        .map((preset) => ({
          ...preset,
          boards: [...preset.boards].sort((a, b) => a.position - b.position),
        })),
    }));
}

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
      `id, title, note, views, created_at, updated_at,
       author:profiles ( id, username, avatar_url ),
       tracks ( id, name, position,
         pedalModel:pedal_models ( id, name, slug, config ),
         presets ( id, name, position,
           boards:preset_boards ( id, position, settings,
             pedalModel:pedal_models ( id, name, slug, config ) ) ) )`,
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
        tracks: sortTracks(upload.tracks),
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
      `id, title, note, views, created_at, updated_at,
       author:profiles ( id, username, avatar_url ),
       tracks ( id, name, position,
         pedalModel:pedal_models ( id, name, slug, config ),
         presets ( id, name, position,
           boards:preset_boards ( id, position, settings,
             pedalModel:pedal_models ( id, name, slug, config ) ) ) )`,
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
    tracks: sortTracks(data.tracks),
  };
}

export type TopUpload = {
  id: string;
  title: string;
  views: number;
  approvals: number;
  author: { username: string } | null;
  song: {
    title: string;
    slug: string;
    band: { name: string; slug: string } | null;
  } | null;
};

/**
 * Destaques da home: os envios mais vistos, com música, banda e aprovações.
 * As aprovações vêm da view `upload_scores`, que só lista quem já recebeu voto —
 * por isso o join é feito aqui, com 0 como padrão.
 */
export async function listMostViewedUploads(limit = 5): Promise<TopUpload[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("uploads")
    .select(
      `id, title, views,
       author:profiles ( username ),
       song:songs ( title, slug, band:bands ( name, slug ) )`,
    )
    .order("views", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  const uploads = data ?? [];
  if (uploads.length === 0) return [];

  const { data: scores } = await supabase
    .from("upload_scores")
    .select("upload_id, approvals")
    .in("upload_id", uploads.map((u) => u.id));

  const approvalsById = new Map(
    (scores ?? []).map((s) => [s.upload_id, s.approvals ?? 0]),
  );

  return uploads.map((upload) => ({
    ...upload,
    approvals: approvalsById.get(upload.id) ?? 0,
  }));
}

/** Envios de um usuário, do mais aprovado ao menos aprovado (perfil). */
export async function listUploadsByUser(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("uploads")
    .select(
      `id, title, note, views, created_at, updated_at,
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

/**
 * Um envio do próprio usuário, na forma que o wizard de edição entende. Volta
 * null quando o envio não existe ou é de outra pessoa — a checagem de dono fica
 * aqui e não só na RLS, para a página de edição responder 404 em vez de abrir
 * um formulário vazio.
 */
export async function getUploadForEdit(uploadId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("uploads")
    .select(
      `id, title, note, user_id,
       song:songs ( id, title, band:bands ( id, name ) ),
       tracks ( id, name, position, pedal_model_id,
         presets ( id, name, position,
           boards:preset_boards ( id, position, settings, pedal_model_id ) ) )`,
    )
    .eq("id", uploadId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.user_id !== userId || !data.song) return null;

  return {
    id: data.id,
    title: data.title,
    note: data.note ?? "",
    song: {
      id: data.song.id,
      title: data.song.title,
      band: data.song.band,
    },
    tracks: [...data.tracks]
      .sort((a, b) => a.position - b.position)
      .map((track) => ({
        name: track.name,
        pedalModelId: track.pedal_model_id,
        presets: [...track.presets]
          .sort((a, b) => a.position - b.position)
          .map((preset) => ({
            name: preset.name,
            boards: [...preset.boards]
              .sort((a, b) => a.position - b.position)
              .map((board) => ({
                pedalModelId: board.pedal_model_id,
                settings: board.settings,
              })),
          })),
      })),
  };
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
  const term = query.trim().slice(0, LIMITS.searchQueryMax);
  if (term.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_catalog", {
    p_query: term,
    p_limit: limit,
  });

  if (error) throw error;
  return data ?? [];
}

/**
 * Só as pedaleiras liberadas para escolha — ver src/lib/pedals/availability.ts.
 * Os envios antigos continuam abrindo com o painel do modelo deles: o filtro é
 * de escolha, não de leitura.
 */
export async function listPedalModels() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedal_models")
    .select("id, name, slug, config")
    .in("slug", [...AVAILABLE_PEDAL_SLUGS])
    .order("name");

  if (error) throw error;
  return data ?? [];
}
