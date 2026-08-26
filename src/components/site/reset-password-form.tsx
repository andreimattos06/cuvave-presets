"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/actions/auth";
import { idleState } from "@/lib/action-state";
import { FieldError } from "@/components/site/auth-card";
import { FieldCheck, RuleList } from "@/components/site/field-rules";
import { PASSWORD_RULES } from "@/lib/validations/auth";
import { LIMITS } from "@/lib/validations/limits";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    resetPassword,
    idleState,
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const passwordOk = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === password;

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(e) => {
        if (!passwordOk || !passwordsMatch) {
          e.preventDefault();
          setTouched(true);
        }
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="password">Nova senha</Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            maxLength={LIMITS.passwordMax}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && !passwordOk}
            className="pr-8"
          />
          <FieldCheck show={passwordOk} />
        </div>
        {!passwordOk && (
          <RuleList
            rules={PASSWORD_RULES}
            value={password}
            pristine={!touched}
          />
        )}
        {passwordOk && <FieldError errors={state.fieldErrors?.password} />}
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <div className="relative mt-1.5">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            maxLength={LIMITS.passwordMax}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
            className="pr-8"
          />
          <FieldCheck show={passwordsMatch} />
        </div>
        {confirmPassword.length > 0 && !passwordsMatch ? (
          <p className="mt-1 text-xs text-destructive">
            As senhas não coincidem.
          </p>
        ) : (
          passwordsMatch && (
            <FieldError errors={state.fieldErrors?.confirmPassword} />
          )
        )}
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
