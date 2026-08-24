import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Busca o usuário autenticado + profile numa única chamada, cacheada por
 * request (React cache) — pode ser chamada em vários Server Components sem
 * refazer a consulta.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { ...user, profile };
});
