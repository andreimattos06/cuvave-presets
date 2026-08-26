"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PedalBoard } from "@/components/pedalboard/pedal-board";
import { DeviceTransfer } from "@/components/mvave/device-transfer";
import { registerUploadView } from "@/actions/uploads";
import type { SongUpload } from "@/lib/data/catalog";
import { Guitar } from "lucide-react";

/**
 * Página do envio: escolhe o instrumento e o preset, e mostra a pedaleira com a
 * configuração exata que o autor subiu (só leitura).
 */
export function UploadViewer({ upload }: { upload: SongUpload }) {
  const [trackId, setTrackId] = useState(upload.tracks[0]?.id ?? "");
  const [presetId, setPresetId] = useState(upload.tracks[0]?.presets[0]?.id ?? "");

  const track = upload.tracks.find((t) => t.id === trackId) ?? upload.tracks[0];
  const preset = track?.presets.find((p) => p.id === presetId) ?? track?.presets[0];

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

          {preset && (
            <>
              <div className="flex justify-end">
                <DeviceTransfer
                  model={track.pedalModel}
                  presetName={preset.name}
                  settings={preset.settings}
                />
              </div>
              <PedalBoard
                modelName={track.pedalModel.name}
                config={track.pedalModel.config}
                presetName={preset.name}
                value={preset.settings}
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
