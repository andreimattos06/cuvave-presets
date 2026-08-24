import Link from "next/link";
import type { Metadata } from "next";
import { searchCatalogRanked } from "@/lib/data/catalog";
import { SearchForm } from "@/components/catalog/search-form";
import { Disc3, Music, SearchX } from "lucide-react";

export const metadata: Metadata = {
  title: "Busca",
  description: "Encontre a música ou o artista e veja os presets da comunidade.",
};

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  const hits = term ? await searchCatalogRanked(term, 30).catch(() => []) : [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold">Buscar</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Digite o nome da música, do artista, ou os dois.
      </p>

      <div className="mt-6">
        <SearchForm
          action="/busca"
          defaultValue={term}
          placeholder="Ex.: Legião Urbana, Tempo Perdido…"
        />
      </div>

      {term && (
        <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
          {hits.length} {hits.length === 1 ? "resultado" : "resultados"} para “
          {term}”
        </p>
      )}

      {term && hits.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 p-12 text-center">
          <SearchX className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nada encontrado. Tente outra grafia ou só o nome do artista.
          </p>
        </div>
      )}

      {hits.length > 0 && (
        <ul className="mt-4 space-y-2">
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <Link
                href={
                  hit.kind === "band"
                    ? `/bandas/${hit.slug}`
                    : `/bandas/${hit.band_slug}/${hit.slug}`
                }
                className="glass flex items-center gap-3 rounded-xl p-4 transition-all hover:border-primary/40 hover:glow-violet"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  {hit.kind === "band" ? (
                    <Disc3 className="size-4" />
                  ) : (
                    <Music className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{hit.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {hit.kind === "band" ? "Artista" : hit.band_name}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {hit.kind === "band"
                    ? `${hit.uploads_count} ${hit.uploads_count === 1 ? "música" : "músicas"}`
                    : `${hit.uploads_count} ${hit.uploads_count === 1 ? "envio" : "envios"}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
