import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/site/auth-card";
import { SignupForm } from "@/components/site/signup-form";
import { safeNextPath } from "@/lib/url";

export const metadata: Metadata = { title: "Criar conta — M-Vave Presets" };

export default async function SignupPage({
  searchParams,
}: PageProps<"/signup">) {
  const params = await searchParams;
  // Quem chegou aqui de uma página protegida volta para ela depois de entrar.
  const next = safeNextPath(params.next);
  // Mensagem vinda de /auth/callback quando o Google devolve erro.
  const error =
    typeof params.error === "string" ? params.error.slice(0, 200) : null;

  return (
    <AuthCard
      title="Crie sua conta"
      subtitle="Cadastre presets e vote nos melhores da comunidade."
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href={next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`}
            className="text-primary hover:underline"
          >
            Entrar
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
      <SignupForm next={next} />
    </AuthCard>
  );
}
