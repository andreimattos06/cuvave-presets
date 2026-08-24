import type { Metadata } from "next";
import { AuthCard } from "@/components/site/auth-card";
import { ResetPasswordForm } from "@/components/site/reset-password-form";

export const metadata: Metadata = { title: "Redefinir senha — Cuvave Presets" };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Defina uma nova senha"
      subtitle="Você chegou aqui pelo link de recuperação enviado por e-mail."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
