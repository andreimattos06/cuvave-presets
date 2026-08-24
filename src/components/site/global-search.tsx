"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchCatalog, type SearchResult } from "@/actions/search";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Disc3, Loader2, Music, Search } from "lucide-react";

const EMPTY: SearchResult = { bands: [], songs: [] };

/** Busca global (Cmd+K / Ctrl+K) por banda ou música, aberta também a visitantes. */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Resultado carrega o termo que o gerou: nunca mostramos resposta de outra busca.
  const [results, setResults] = useState<{ term: string; data: SearchResult }>({
    term: "",
    data: EMPTY,
  });
  const [pending, startTransition] = useTransition();

  const term = query.trim();
  const current = results.term === term ? results.data : EMPTY;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounce: evita uma consulta por tecla digitada.
  useEffect(() => {
    if (term.length < 2) return;
    const timer = setTimeout(() => {
      startTransition(async () =>
        setResults({ term, data: await searchCatalog(term) }),
      );
    }, 220);
    return () => clearTimeout(timer);
  }, [term]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const hasResults = current.bands.length > 0 || current.songs.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Buscar…</span>
        <kbd className="hidden rounded border border-white/10 px-1.5 font-mono text-[10px] sm:inline">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar no catálogo"
        description="Encontre bandas e músicas pelo nome"
      >
        {/* filtragem é do servidor: o cmdk não deve reordenar/esconder nada */}
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Banda ou música…"
          />
          <CommandList>
            {term.length < 2 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Digite ao menos 2 letras.
              </p>
            ) : pending && !hasResults ? (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Procurando…
              </p>
            ) : (
              <CommandEmpty>Nada encontrado para “{query}”.</CommandEmpty>
            )}

            {current.bands.length > 0 && (
              <CommandGroup heading="Bandas">
                {current.bands.map((band) => (
                  <CommandItem
                    key={band.id}
                    value={`band-${band.id}`}
                    onSelect={() => go(`/bandas/${band.slug}`)}
                  >
                    <Disc3 />
                    {band.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {current.songs.length > 0 && (
              <CommandGroup heading="Músicas">
                {current.songs.map((song) => (
                  <CommandItem
                    key={song.id}
                    value={`song-${song.id}`}
                    disabled={!song.band}
                    onSelect={() =>
                      song.band && go(`/bandas/${song.band.slug}/${song.slug}`)
                    }
                  >
                    <Music />
                    {song.title}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {song.band?.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
