import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Unplug } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Unplug className="size-6" />
      </span>
      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
        Cabo desconectado
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Não encontramos essa página. Talvez a banda ou a música ainda não esteja
        no catálogo.
      </p>
      <div className="mt-6 flex gap-3">
        <Button render={<Link href="/bandas">Ver bandas</Link>} />
        <Button variant="ghost" render={<Link href="/">Voltar ao início</Link>} />
      </div>
    </div>
  );
}
