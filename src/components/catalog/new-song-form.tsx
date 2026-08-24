"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSong } from "@/actions/catalog";
import { idleState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/site/auth-card";
import { Loader2, Plus } from "lucide-react";

export function NewSongForm({ bandId }: { bandId: string }) {
  const [state, formAction, pending] = useActionState(createSong, idleState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="glass rounded-xl p-4">
      <input type="hidden" name="bandId" value={bandId} />
      <Label htmlFor="song-title">Adicionar música</Label>
      <p className="mt-1 text-xs text-muted-foreground">
        Cadastre a música para poder enviar presets para ela.
      </p>
      <div className="mt-3 flex gap-2">
        <Input
          id="song-title"
          name="title"
          placeholder="Ex.: Tempo Perdido"
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
      <FieldError errors={state.fieldErrors?.title} />
      {state.status === "error" && (
        <p className="mt-1 text-xs text-destructive">{state.message}</p>
      )}
    </form>
  );
}
