"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function GoogleButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        // Sem isso o Google entra direto com a última conta usada — e quem tem
        // conta pessoal e de banda não consegue escolher qual vai entrar.
        queryParams: { prompt: "select_account" },
      },
    });
    // Só cai aqui se nem der para montar a URL de autorização (rede fora do ar,
    // env do Supabase errada). Provider desabilitado só aparece depois, na
    // resposta do /auth/v1/authorize — aí a navegação já saiu do app.
    if (error) {
      toast.error("Não foi possível iniciar o login com Google. Tente de novo.");
      setLoading(false);
    }
    // Em caso de sucesso o navegador é redirecionado para o Google.
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.28A7.19 7.19 0 0 1 4.91 12c0-.79.14-1.56.36-2.28V6.63H1.29A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.29 5.37z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.98 3.09C6.22 6.88 8.87 4.77 12 4.77z"
          />
        </svg>
      )}
      {loading ? "Abrindo o Google…" : "Continuar com Google"}
    </Button>
  );
}
