import { headers } from "next/headers";

/** Origem absoluta do request atual (usada em redirectTo de fluxos de e-mail do Supabase). */
export async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  return `${proto}://${host}`;
}

/**
 * Só aceita caminhos internos ("/algo"), evitando open redirect via
 * `?next=https://site-malicioso` ou `?next=//site-malicioso`.
 */
export function safeNextPath(next: unknown, fallback = "/") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
