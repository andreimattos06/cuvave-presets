import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/site/auth-card";
import { LoginForm } from "@/components/site/login-form";
import { safeNextPath } from "@/lib/url";

export const metadata: Metadata = { title: "Entrar — M-Vave Presets" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  // Mensagem vinda de /auth/confirm e /auth/callback (link de e-mail expirado etc).
  const error =
    typeof params.error === "string" ? params.error.slice(0, 200) : null;

  return (
    <AuthCard
      title="Bem-vindo de volta"
      subtitle="Entre para enviar e avaliar presets."
      footer={
        <>
          Não tem conta?{" "}
          <Link
            href={
              next === "/" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`
            }
            className="text-primary hover:underline"
          >
            Criar conta
          </Link>
        </>
      }
    >
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
