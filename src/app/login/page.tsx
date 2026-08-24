import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/site/auth-card";
import { LoginForm } from "@/components/site/login-form";
import { safeNextPath } from "@/lib/url";

export const metadata: Metadata = { title: "Entrar — Cuvave Presets" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNextPath((await searchParams).next);

  return (
    <AuthCard
      title="Bem-vindo de volta"
      subtitle="Entre para enviar e avaliar presets."
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
