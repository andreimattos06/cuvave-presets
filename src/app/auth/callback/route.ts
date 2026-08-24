import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/url";

/**
 * Ponto único de retorno para os fluxos PKCE do Supabase: OAuth (Google),
 * confirmação de e-mail e recuperação de senha. Todos chegam aqui com
 * ?code=... para ser trocado por uma sessão.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Não foi possível confirmar sua sessão. Tente novamente.`,
  );
}
