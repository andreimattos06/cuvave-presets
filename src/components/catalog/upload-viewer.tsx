"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PedalBoard } from "@/components/pedalboard/pedal-board";
import { TkgDownloadButton } from "@/components/mvave/tkg-panel";
import { supportsTkg } from "@/lib/mvave/tkg";
import { registerUploadView } from "@/actions/uploads";
import type { SongUpload } from "@/lib/data/catalog";
import { Guitar, Sliders } from "lucide-react";

/**
 * Página do envio: escolhe o instrumento e o preset, e mostra a pedaleira com a
 * configuração exata que o autor subiu (só leitura).
 */
export function UploadViewer({
  upload,
  songTitle,
}: {
  upload: SongUpload;
  /** Entra no nome do arquivo .tkg; a música não está no envio. */
  songTitle?: string;
}) {
  const [trackId, setTrackId] = useState(upload.tracks[0]?.id ?? "");
  const [presetId, setPresetId] = useState(upload.tracks[0]?.presets[0]?.id ?? "");
  /** Pedaleira escolhida pelo slug, para a escolha sobreviver à troca de preset. */
  const [boardSlug, setBoardSlug] = useState("");

  const track = upload.tracks.find((t) => t.id === trackId) ?? upload.tracks[0];
  const preset = track?.presets.find((p) => p.id === presetId) ?? track?.presets[0];
  const board =
    preset?.boards.find((b) => b.pedalModel.slug === boardSlug) ?? preset?.boards[0];

  // Só conta quando a página monta de fato no navegador — o prefetch do Next
  // busca a rota antes de qualquer clique e inflaria o contador.
  useEffect(() => {
    void registerUploadView(upload.id);
  }, [upload.id]);

  if (upload.tracks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
        Este envio não tem instrumentos cadastrados.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Instrumento
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {upload.tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTrackId(t.id);
                setPresetId(t.presets[0]?.id ?? "");
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                t.id === track?.id
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-white/10 text-muted-foreground hover:text-foreground",
              )}
            >
              <Guitar className="size-3" />
              {t.name}
              <span className="opacity-60">{t.pedalModel.name}</span>
            </button>
          ))}
        </div>
      </div>

      {track && track.presets.length > 0 ? (
        <>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Preset
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {track.presets.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    p.id === preset?.id
                      ? "border-accent/50 bg-accent/15 text-accent"
                      : "border-white/10 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="mr-1.5 font-mono opacity-60">{i + 1}</span>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {preset && board && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Um trecho pode vir descrito em mais de um aparelho; com um
                    só, mostrar a escolha seria ruído. */}
                {preset.boards.length > 1 ? (
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Pedaleira"
                  >
                    {preset.boards.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBoardSlug(b.pedalModel.slug)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          b.id === board.id
                            ? "border-primary/40 bg-primary/15 text-primary"
                            : "border-white/10 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Sliders className="size-3" />
                        {b.pedalModel.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span />
                )}

                {/* Quem está vendo o preset dos outros só quer levar para a
                    pedaleira — daí só o .tkg, sem as abas de MIDI e código. */}
                {supportsTkg(board.pedalModel.slug) && (
                  <TkgDownloadButton
                    model={board.pedalModel}
                    settings={board.settings}
                    parts={{
                      song: songTitle,
                      track: track.name,
                      preset: preset.name,
                    }}
                  />
                )}
              </div>

              <PedalBoard
                key={board.id}
                modelName={board.pedalModel.name}
                config={board.pedalModel.config}
                presetName={preset.name}
                value={board.settings}
                readOnly
              />
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Este instrumento não tem presets.
        </p>
      )}
    </div>
  );
}
