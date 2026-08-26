import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Rate limit das server actions, contado no Postgres (ver
 * supabase/migrations/0004_security_limits.sql) — memória de processo não serve
 * porque cada instância serverless teria o seu próprio contador.
 */

export type RateLimitRule = { limit: number; windowSeconds: number };

/**
 * Tetos por ação. Os de autenticação são apertados de propósito: é onde
 * força bruta e enumeração de conta doem.
 */
export const RATE_LIMITS = {
  login: { limit: 10, windowSeconds: 300 },
  signup: { limit: 5, windowSeconds: 3600 },
  passwordRecovery: { limit: 5, windowSeconds: 3600 },
  passwordUpdate: { limit: 10, windowSeconds: 3600 },
  catalogWrite: { limit: 30, windowSeconds: 3600 },
  upload: { limit: 12, windowSeconds: 3600 },
  vote: { limit: 60, windowSeconds: 300 },
  view: { limit: 20, windowSeconds: 3600 },
  search: { limit: 90, windowSeconds: 60 },
} satisfies Record<string, RateLimitRule>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Sal do hash do balde. Sem ele, quem tem a anon key poderia calcular o balde
 * alheio e chamar a RPC até bloquear a vítima. Defina RATE_LIMIT_SALT em
 * produção — o fallback só existe para o ambiente de desenvolvimento.
 */
const SALT =
  process.env.RATE_LIMIT_SALT?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  "mvave-presets-dev-salt";

function bucketOf(action: RateLimitAction, scope: string) {
  return createHash("sha256").update(`${SALT}:${action}:${scope}`).digest("hex");
}

/**
 * IP do cliente pela cadeia de proxies. Vale como identificador aproximado: o
 * primeiro salto é o que o proxy da hospedagem escreveu, e o resto pode ser
 * forjado — por isso só o primeiro é considerado.
 */
export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "ip-desconhecido";
}

export type RateLimitVerdict = { ok: true } | { ok: false; retryAfter: number };

/**
 * Consome uma tentativa. `scope` separa os contadores (IP, id do usuário,
 * e-mail informado…); quando omitido, usa o IP.
 */
export async function consumeRateLimit(
  action: RateLimitAction,
  scope?: string,
): Promise<RateLimitVerdict> {
  const rule = RATE_LIMITS[action];
  const key = scope ?? (await getClientIp());

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_bucket: bucketOf(action, key),
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });

    if (error) throw error;
    const retryAfter = data ?? 0;
    return retryAfter > 0 ? { ok: false, retryAfter } : { ok: true };
  } catch (error) {
    // Banco indisponível ou migração ainda não aplicada: melhor deixar passar
    // do que derrubar login e envio do site inteiro.
    console.warn("[rate-limit] falhou, liberando a chamada:", error);
    return { ok: true };
  }
}

/** Mensagem pronta para o usuário, com o tempo de espera em português. */
export function rateLimitMessage(
  retryAfter: number,
  what = "Muitas tentativas seguidas.",
) {
  if (retryAfter >= 120) {
    return `${what} Tente de novo em ${Math.ceil(retryAfter / 60)} minutos.`;
  }
  if (retryAfter > 60) return `${what} Tente de novo em cerca de 1 minuto.`;
  return `${what} Tente de novo em ${retryAfter} segundos.`;
}
