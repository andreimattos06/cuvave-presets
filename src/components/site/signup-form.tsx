"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/actions/auth";
import { idleState } from "@/lib/action-state";
import { FieldError } from "@/components/site/auth-card";
import { FieldCheck, RuleList } from "@/components/site/field-rules";
import { GoogleButton } from "@/components/site/google-button";
import { Separator } from "@/components/ui/separator";
import { Loader2, PartyPopper } from "lucide-react";
import {
  PASSWORD_RULES,
  USERNAME_RULES,
  emailIssue,
} from "@/lib/validations/auth";
import { LIMITS } from "@/lib/validations/limits";

type Field = "username" | "email" | "password" | "confirmPassword";

const EMPTY = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
} satisfies Record<Field, string>;

const ALL_TOUCHED = {
  username: true,
  email: true,
  password: true,
  confirmPassword: true,
} satisfies Record<Field, boolean>;

export function SignupForm({ next = "/" }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signup, idleState);
  const [values, setValues] = useState<Record<Field, string>>(EMPTY);
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [focused, setFocused] = useState<Field | null>(null);

  const usernameOk = USERNAME_RULES.every((r) => r.test(values.username));
  const emailError = emailIssue(values.email);
  const passwordOk = PASSWORD_RULES.every((r) => r.test(values.password));
  const passwordsMatch =
    values.confirmPassword.length > 0 &&
    values.confirmPassword === values.password;
  const formOk = usernameOk && !emailError && passwordOk && passwordsMatch;

  // Erro só aparece depois que a pessoa saiu do campo (ou tentou enviar);
  // a partir daí ele atualiza a cada tecla até o campo ficar válido.
  const showErrorFor = (field: Field) => touched[field] && focused !== field;

  const bind = (field: Field) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value })),
    onFocus: () => setFocused(field),
    onBlur: () => {
      setFocused(null);
      setTouched((t) => ({ ...t, [field]: true }));
    },
  });

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
      <GoogleButton next={next} />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou com e-mail</span>
        <Separator className="flex-1" />
      </div>

      <form
        action={formAction}
        noValidate
        onSubmit={(e) => {
          // O server valida de novo com o mesmo schema; isto só evita o
          // round-trip quando dá para apontar o problema aqui mesmo.
          if (!formOk) {
            e.preventDefault();
            setTouched(ALL_TOUCHED);
          }
        }}
        className="space-y-4"
      >
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="username">Nome de usuário</Label>
          <div className="relative mt-1.5">
            <Input
              id="username"
              name="username"
              autoComplete="username"
              maxLength={LIMITS.usernameMax}
              placeholder="ex: joao-guitarrista"
              aria-invalid={touched.username && !usernameOk}
              className="pr-8"
              {...bind("username")}
            />
            <FieldCheck show={usernameOk} />
          </div>
          {(focused === "username" || (touched.username && !usernameOk)) && (
            <RuleList
              rules={USERNAME_RULES}
              value={values.username}
              pristine={focused === "username" && !touched.username}
            />
          )}
          {usernameOk && <FieldError errors={state.fieldErrors?.username} />}
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <div className="relative mt-1.5">
            <Input
              id="email"
              name="email"
              type="email"
              maxLength={LIMITS.emailMax}
              inputMode="email"
              autoComplete="email"
              placeholder="voce@gmail.com"
              aria-invalid={touched.email && !!emailError}
              className="pr-8"
              {...bind("email")}
            />
            <FieldCheck show={!emailError} />
          </div>
          {showErrorFor("email") && emailError ? (
            <p className="mt-1 text-xs text-destructive">{emailError}</p>
          ) : (
            !emailError && <FieldError errors={state.fieldErrors?.email} />
          )}
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <div className="relative mt-1.5">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              maxLength={LIMITS.passwordMax}
              aria-invalid={touched.password && !passwordOk}
              className="pr-8"
              {...bind("password")}
            />
            <FieldCheck show={passwordOk} />
          </div>
          {(focused === "password" || (touched.password && !passwordOk)) && (
            <RuleList
              rules={PASSWORD_RULES}
              value={values.password}
              pristine={focused === "password" && !touched.password}
            />
          )}
          {passwordOk && <FieldError errors={state.fieldErrors?.password} />}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <div className="relative mt-1.5">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              maxLength={LIMITS.passwordMax}
              aria-invalid={touched.confirmPassword && !passwordsMatch}
              className="pr-8"
              {...bind("confirmPassword")}
            />
            <FieldCheck show={passwordsMatch} />
          </div>
          {values.confirmPassword.length > 0 && !passwordsMatch ? (
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

        <Button
          type="submit"
          className="w-full glow-violet"
          disabled={pending}
          aria-disabled={!formOk}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Criar conta
        </Button>
      </form>
    </div>
  );
}
