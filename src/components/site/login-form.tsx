"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/actions/auth";
import { idleState } from "@/lib/action-state";
import { LIMITS } from "@/lib/validations/limits";
import { FieldError } from "@/components/site/auth-card";
import { GoogleButton } from "@/components/site/google-button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function LoginForm({ next = "/" }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, idleState);

  return (
    <div className="space-y-5">
      <GoogleButton next={next} />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou com e-mail</span>
        <Separator className="flex-1" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
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
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/esqueci-senha"
              className="text-xs text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={LIMITS.passwordMax}
            required
            className="mt-1.5"
          />
          <FieldError errors={state.fieldErrors?.password} />
        </div>

        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        <Button type="submit" className="w-full glow-violet" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Entrar
        </Button>
      </form>
    </div>
  );
}
