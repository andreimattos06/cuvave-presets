"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldRule } from "@/lib/validations/auth";

/**
 * Checklist que reage a cada tecla. Antes do primeiro blur (`pristine`) as
 * regras aparecem em cinza — ninguém gosta de ver o formulário todo em vermelho
 * antes de terminar de digitar.
 */
export function RuleList({
  rules,
  value,
  pristine = false,
  className,
}: {
  rules: FieldRule[];
  value: string;
  pristine?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("mt-2 space-y-1", className)}>
      {rules.map((rule) => {
        const ok = rule.test(value);
        const neutral = pristine && !ok;
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              ok
                ? "text-neon-green"
                : neutral
                  ? "text-muted-foreground"
                  : "text-destructive",
            )}
          >
            {ok ? (
              <Check className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <X
                className={cn("size-3.5 shrink-0", neutral && "opacity-50")}
                aria-hidden
              />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

/** Marca de "campo ok" exibida dentro do input. */
export function FieldCheck({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Check
      aria-hidden
      className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-neon-green"
    />
  );
}
