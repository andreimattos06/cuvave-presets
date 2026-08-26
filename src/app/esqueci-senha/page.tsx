import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/site/auth-card";
import { ForgotPasswordForm } from "@/components/site/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar senha — M-Vave Presets" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber um link de redefinição."
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
