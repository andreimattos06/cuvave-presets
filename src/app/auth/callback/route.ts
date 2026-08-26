import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/url";

/**
 * Ponto único de retorno para os fluxos PKCE do Supabase: OAuth (Google),
 * confirmação de e-mail e recuperação de senha. Todos chegam aqui com
 * ?code=... para ser trocado por uma sessão.
 */

/**
 * O provider (ou o próprio Supabase) devolve o motivo em `error`/`error_code`.
 * Traduzir os casos comuns evita mandar "tente novamente" para quem, por
 * exemplo, só clicou em "cancelar" na tela do Google.
 */
function messageFor(error: string, errorCode: string | null) {
  if (error === "access_denied") {
    return "Login com Google cancelado. Você pode tentar de novo ou entrar com e-mail e senha.";
  }
  if (errorCode === "provider_disabled" || error === "unsupported_provider") {
    return "O login com Google não está disponível no momento. Use e-mail e senha.";
  }
  if (errorCode === "identity_already_exists") {
    return "Esta conta Google já está ligada a outro usuário.";
  }
  if (error === "server_error" || errorCode === "unexpected_failure") {
    return "O Google não conseguiu concluir o login. Tente de novo em instantes.";
  }
  return "Não foi possível concluir o login com Google. Tente de novo.";
}

function backToLogin(origin: string, message: string, next: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  if (next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const error = searchParams.get("error");

  // Quem cancela na tela do Google volta com ?error=access_denied e sem code.
  if (error) {
    return backToLogin(
      origin,
      messageFor(error, searchParams.get("error_code")),
      next,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return backToLogin(
    origin,
    "Não foi possível confirmar sua sessão. Tente novamente.",
    next,
  );
}
