"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBand } from "@/actions/catalog";
import { idleState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/site/auth-card";
import { Loader2, Plus } from "lucide-react";
import { LIMITS } from "@/lib/validations/limits";

export function NewBandForm() {
  const [state, formAction, pending] = useActionState(createBand, idleState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="glass rounded-xl p-4">
      <Label htmlFor="band-name">Cadastrar uma banda</Label>
      <p className="mt-1 text-xs text-muted-foreground">
        Não achou a banda? Adicione — ela fica disponível para todo mundo.
      </p>
      <div className="mt-3 flex gap-2">
        <Input
          id="band-name"
          name="name"
          maxLength={LIMITS.bandNameMax}
          placeholder="Ex.: Legião Urbana"
          required
          className="flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Adicionar
        </Button>
      </div>
      <FieldError errors={state.fieldErrors?.name} />
      {state.status === "error" && (
        <p className="mt-1 text-xs text-destructive">{state.message}</p>
      )}
    </form>
  );
}
