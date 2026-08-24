"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  bands: { id: string; name: string; slug: string }[];
  songs: {
    id: string;
    title: string;
    slug: string;
    band: { name: string; slug: string } | null;
  }[];
};

/**
 * Busca do Cmd+K: bandas e músicas em uma ida ao servidor, ordenadas por
 * relevância pela função search_catalog. Aberta a visitantes.
 */
export async function searchCatalog(query: string): Promise<SearchResult> {
  const term = query.trim();
  if (term.length < 2) return { bands: [], songs: [] };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_catalog", {
    p_query: term,
    p_limit: 13,
  });

  if (error || !data) return { bands: [], songs: [] };

  return {
    bands: data
      .filter((hit) => hit.kind === "band")
      .slice(0, 5)
      .map((hit) => ({ id: hit.id, name: hit.title, slug: hit.slug })),
    songs: data
      .filter((hit) => hit.kind === "song")
      .slice(0, 8)
      .map((hit) => ({
        id: hit.id,
        title: hit.title,
        slug: hit.slug,
        band: { name: hit.band_name, slug: hit.band_slug },
      })),
  };
}
