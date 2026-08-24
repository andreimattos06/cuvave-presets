import Link from "next/link";
import { Guitar } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Guitar className="size-4 text-primary" />
          Cuvave Presets — feito por guitarristas, para guitarristas.
        </p>
        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/bandas" className="transition-colors hover:text-foreground">
            Bandas
          </Link>
          <Link href="/pedaleira" className="transition-colors hover:text-foreground">
            Pedaleira
          </Link>
          <Link href="/enviar" className="transition-colors hover:text-foreground">
            Enviar preset
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-4 max-w-6xl text-xs text-muted-foreground/70">
        Projeto independente da comunidade. Cuvave é marca de seus respectivos
        donos.
      </p>
    </footer>
  );
}
