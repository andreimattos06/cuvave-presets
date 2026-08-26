import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * O app conversa com o Supabase (REST, Auth e Realtime) e, na transferência de
 * presets, com a pedaleira via WebMIDI. Fora isso, tudo vem da própria origem.
 */
const supabaseOrigin =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "") ||
  "https://*.supabase.co";
const supabaseSocket = supabaseOrigin.replace(/^https:/, "wss:");

/**
 * CSP sem nonce: manter o `unsafe-inline` de script custa menos do que obrigar
 * todas as páginas a renderizar dinamicamente (o nonce exige request a cada
 * visita — ver node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 * O ganho real aqui é `frame-ancestors`, `object-src` e `base-uri`.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseSocket}${isDev ? " ws: http://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // midi=(self): a transferência de presets fala com a pedaleira pelo WebMIDI.
    value: "camera=(), microphone=(), geolocation=(), payment=(), midi=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O maior envio possível (10 instrumentos × 8 presets) não passa de ~100 KB;
      // o padrão de 1 MB só serviria para desperdiçar CPU com corpo inflado.
      bodySizeLimit: "256kb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
