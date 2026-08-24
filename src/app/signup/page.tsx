import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/site/auth-card";
import { SignupForm } from "@/components/site/signup-form";

export const metadata: Metadata = { title: "Criar conta — Cuvave Presets" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Crie sua conta"
      subtitle="Cadastre presets e vote nos melhores da comunidade."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
