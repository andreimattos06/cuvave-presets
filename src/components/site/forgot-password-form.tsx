"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/actions/auth";
import { idleState } from "@/lib/action-state";
import { LIMITS } from "@/lib/validations/limits";
import { FieldError } from "@/components/site/auth-card";
import { Loader2, MailCheck } from "lucide-react";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPassword,
    idleState,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 p-6 text-center">
        <MailCheck className="size-6 text-primary" />
        <p className="text-sm text-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          maxLength={LIMITS.emailMax}
          autoComplete="email"
          required
          className="mt-1.5"
        />
        <FieldError errors={state.fieldErrors?.email} />
      </div>

      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <Button type="submit" className="w-full glow-violet" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Enviar link de recuperação
      </Button>
    </form>
  );
}
