import type { Metadata } from "next";
import Link from "next/link";
import { listBands } from "@/lib/data/catalog";
import { getCurrentUser } from "@/lib/auth";
import { SearchForm } from "@/components/catalog/search-form";
import { NewBandForm } from "@/components/catalog/new-band-form";
import { Music2, Disc3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Bandas — Cuvave Presets",
  description: "Navegue pelas bandas com presets enviados pela comunidade.",
};

export default async function BandsPage({ searchParams }: PageProps<"/bandas">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;

  const [bands, user] = await Promise.all([listBands(query), getCurrentUser()]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Bandas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha uma banda para ver as músicas e os presets enviados.
          </p>
        </div>
        <SearchForm action="/bandas" defaultValue={query} placeholder="Buscar banda…" />
      </header>

      {user && (
        <div className="mt-8">
          <NewBandForm />
        </div>
      )}

      {bands.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          {query
            ? `Nenhuma banda encontrada para “${query}”.`
            : "O catálogo ainda está vazio. Seja o primeiro a cadastrar uma banda."}
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bands.map((band) => (
            <li key={band.id}>
              <Link
                href={`/bandas/${band.slug}`}
                className="glass group flex items-center gap-4 rounded-xl p-4 transition-all hover:border-primary/40 hover:glow-violet"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Disc3 className="size-6 transition-transform group-hover:rotate-45" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{band.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Music2 className="size-3" />
                    {band.songCount}{" "}
                    {band.songCount === 1 ? "música" : "músicas"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
