"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUploadWizard } from "@/lib/store/upload-wizard";
import { createBand, createSong } from "@/actions/catalog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, Loader2, Plus, Search } from "lucide-react";

type Band = { id: string; name: string; slug: string };
type Song = { id: string; title: string };

export function StepSong({ bands: initialBands }: { bands: Band[] }) {
  const { bandId, bandName, songId, setBand, setSong } = useUploadWizard();

  const [bands, setBands] = useState(initialBands);
  const [bandQuery, setBandQuery] = useState("");
  // Guardamos de qual banda a lista veio: assim ela nunca aparece sob outra banda.
  const [songs, setSongs] = useState<{ bandId: string; list: Song[] }>({
    bandId: "",
    list: [],
  });
  const [songQuery, setSongQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const loadingSongs = Boolean(bandId) && songs.bandId !== bandId;

  const filteredBands = useMemo(() => {
    const q = bandQuery.trim().toLowerCase();
    return q ? bands.filter((b) => b.name.toLowerCase().includes(q)) : bands;
  }, [bands, bandQuery]);

  const filteredSongs = useMemo(() => {
    const list = songs.bandId === bandId ? songs.list : [];
    const q = songQuery.trim().toLowerCase();
    return q ? list.filter((s) => s.title.toLowerCase().includes(q)) : list;
  }, [songs, bandId, songQuery]);

  useEffect(() => {
    if (!bandId) return;
    let active = true;
    createClient()
      .from("songs")
      .select("id, title")
      .eq("band_id", bandId)
      .order("title")
      .then(({ data }) => {
        if (active) setSongs({ bandId, list: data ?? [] });
      });
    return () => {
      active = false;
    };
  }, [bandId]);

  async function handleCreateBand() {
    const name = bandQuery.trim();
    if (name.length < 2) return;
    setCreating(true);
    const form = new FormData();
    form.set("name", name);
    const result = await createBand({ status: "idle" }, form);
    setCreating(false);

    if (result.status === "error" || !result.band) {
      toast.error(result.message ?? "Não foi possível cadastrar a banda.");
      return;
    }
    setBands((prev) =>
      prev.some((b) => b.id === result.band!.id)
        ? prev
        : [...prev, { ...result.band!, slug: result.band!.slug }].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
    );
    setBand(result.band);
    setBandQuery("");
    toast.success(result.message ?? "Banda cadastrada!");
  }

  async function handleCreateSong() {
    const title = songQuery.trim();
    if (!title || !bandId) return;
    setCreating(true);
    const form = new FormData();
    form.set("title", title);
    form.set("bandId", bandId);
    const result = await createSong({ status: "idle" }, form);
    setCreating(false);

    if (result.status === "error" || !result.song) {
      toast.error(result.message ?? "Não foi possível cadastrar a música.");
      return;
    }
    setSongs((prev) =>
      prev.list.some((s) => s.id === result.song!.id)
        ? prev
        : {
            bandId,
            list: [...prev.list, { id: result.song!.id, title: result.song!.title }],
          },
    );
    setSong({ id: result.song.id, title: result.song.title });
    setSongQuery("");
    toast.success(result.message ?? "Música cadastrada!");
  }

  const bandExists = filteredBands.some(
    (b) => b.name.toLowerCase() === bandQuery.trim().toLowerCase(),
  );
  const songExists = filteredSongs.some(
    (s) => s.title.toLowerCase() === songQuery.trim().toLowerCase(),
  );

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <Label htmlFor="band-search">Banda</Label>
        <div className="relative mt-1.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="band-search"
            value={bandQuery}
            onChange={(e) => setBandQuery(e.target.value)}
            placeholder="Buscar ou cadastrar banda…"
            className="pl-9"
          />
        </div>

        {bandQuery.trim().length >= 2 && !bandExists && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 w-full"
            disabled={creating}
            onClick={handleCreateBand}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Cadastrar “{bandQuery.trim()}”
          </Button>
        )}

        <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
          {filteredBands.map((band) => (
            <li key={band.id}>
              <button
                type="button"
                onClick={() => setBand(band)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  band.id === bandId
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/[0.08] hover:bg-white/[0.04]",
                )}
              >
                {band.name}
                {band.id === bandId && <Check className="size-4" />}
              </button>
            </li>
          ))}
          {filteredBands.length === 0 && (
            <li className="px-1 py-3 text-sm text-muted-foreground">
              Nenhuma banda encontrada.
            </li>
          )}
        </ul>
      </section>

      <section>
        <Label htmlFor="song-search">Música</Label>
        <div className="relative mt-1.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="song-search"
            value={songQuery}
            onChange={(e) => setSongQuery(e.target.value)}
            placeholder={
              bandId ? "Buscar ou cadastrar música…" : "Escolha a banda primeiro"
            }
            disabled={!bandId}
            className="pl-9"
          />
        </div>

        {bandId && songQuery.trim() && !songExists && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 w-full"
            disabled={creating}
            onClick={handleCreateSong}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Cadastrar “{songQuery.trim()}” em {bandName}
          </Button>
        )}

        <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
          {loadingSongs && (
            <li className="flex items-center gap-2 px-1 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando músicas…
            </li>
          )}
          {!loadingSongs &&
            filteredSongs.map((song) => (
              <li key={song.id}>
                <button
                  type="button"
                  onClick={() => setSong(song)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    song.id === songId
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-white/[0.08] hover:bg-white/[0.04]",
                  )}
                >
                  {song.title}
                  {song.id === songId && <Check className="size-4" />}
                </button>
              </li>
            ))}
          {!loadingSongs && bandId && filteredSongs.length === 0 && (
            <li className="px-1 py-3 text-sm text-muted-foreground">
              Esta banda ainda não tem músicas cadastradas.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
