"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteUpload } from "@/actions/uploads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Trash2 } from "lucide-react";

/**
 * Editar e excluir um envio próprio. Excluir leva junto instrumentos, presets,
 * pedaleiras e votos — por isso passa por uma confirmação que diz o que some,
 * e não por um clique só.
 */
export function UploadActions({
  uploadId,
  title,
  presetCount,
}: {
  uploadId: string;
  title: string;
  presetCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteUpload(uploadId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Envio excluído.");
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        render={
          <Link href={`/enviar?editar=${uploadId}`}>
            <Pencil className="size-4" />
            Editar
          </Link>
        }
      />

      <Dialog>
        <DialogTrigger
          render={
            <Button variant="ghost" size="sm" aria-label={`Excluir ${title}`}>
              <Trash2 className="size-4" />
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir “{title}”?</DialogTitle>
            <DialogDescription>
              Somem os {presetCount} {presetCount === 1 ? "preset" : "presets"} deste
              envio, junto com os instrumentos e os votos que ele recebeu. Não dá
              para desfazer.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Excluir envio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
