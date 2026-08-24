"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
        <TriangleAlert className="size-6" />
      </span>
      <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">
        Deu ruído na linha
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Algo falhou ao carregar esta página. Tente de novo — se persistir, o
        servidor pode estar sem conexão com o banco.
      </p>
      {error.digest && (
        <code className="mt-3 rounded bg-white/5 px-2 py-1 font-mono text-xs text-muted-foreground">
          {error.digest}
        </code>
      )}
      <Button className="mt-6" onClick={reset}>
        <RotateCcw className="size-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
