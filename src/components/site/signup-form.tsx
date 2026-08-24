"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/actions/auth";
import { idleState } from "@/lib/action-state";
import { FieldError } from "@/components/site/auth-card";
import { GoogleButton } from "@/components/site/google-button";
import { Separator } from "@/components/ui/separator";
import { Loader2, PartyPopper } from "lucide-react";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, idleState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 p-6 text-center">
        <PartyPopper className="size-6 text-primary" />
        <p className="text-sm text-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleButton />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou com e-mail</span>
        <Separator className="flex-1" />
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="username">Nome de usuário</Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="mt-1.5"
            placeholder="ex: joao-guitarrista"
          />
          <FieldError errors={state.fieldErrors?.username} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1.5"
          />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
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
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
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
          Criar conta
        </Button>
      </form>
    </div>
  );
}
