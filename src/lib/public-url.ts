/**
 * Origem canônica do site, para uso no browser.
 *
 * Não dá para confiar em `window.location.origin` nos redirects de OAuth: cada
 * deploy da Vercel também responde numa URL com hash
 * (`cuvave-presets-7xa6d1mzt-….vercel.app`), e essa URL nunca vai estar na lista
 * de Redirect URLs do Supabase — quando o endereço não bate com a lista, o
 * Supabase manda a pessoa para o Site URL do projeto em vez do lugar pedido.
 *
 * Com NEXT_PUBLIC_SITE_URL definida (produção), o retorno sempre cai no domínio
 * de verdade. Sem ela (dev e previews), vale a origem atual.
 */
export function publicOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  return typeof window === "undefined" ? "" : window.location.origin;
}
