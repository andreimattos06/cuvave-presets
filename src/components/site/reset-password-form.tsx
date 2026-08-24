"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/actions/auth";
import { idleState } from "@/lib/action-state";
import { FieldError } from "@/components/site/auth-card";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    resetPassword,
    idleState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1.5"
        />
        <FieldError errors={state.fieldErrors?.password} />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1.5"
        />
        <FieldError errors={state.fieldErrors?.confirmPassword} />
      </div>

      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <Button type="submit" className="w-full glow-violet" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Redefinir senha
      </Button>
    </form>
  );
}
