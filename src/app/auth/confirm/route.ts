import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/url";

const TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Confirmação de e-mail por token_hash (`{{ .TokenHash }}` nos templates).
 *
 * Diferente de /auth/callback, este fluxo não depende do code verifier PKCE
 * guardado em cookie — ou seja, o link do e-mail funciona mesmo aberto em outro
 * navegador ou celular, que é como a maioria das pessoas abre a caixa de entrada.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));

  if (tokenHash && TYPES.includes(type as EmailOtpType)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const message =
    "Este link de confirmação expirou ou já foi usado. Faça login para receber um novo.";
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(message)}`,
  );
}
