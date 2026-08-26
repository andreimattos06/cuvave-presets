import { headers } from "next/headers";

/**
 * Origem absoluta usada nos redirectTo dos fluxos de e-mail do Supabase.
 * Em produção, defina NEXT_PUBLIC_SITE_URL — o host do request pode ser interno
 * (proxy/preview) e geraria links de e-mail que não abrem fora do servidor.
 */
export async function getOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

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
