"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TKG_BYTE_LENGTH,
  TkgError,
  decodeTkg,
  encodeTkg,
  summarizePreset,
  tkgFileName,
  type PresetSummaryRow,
} from "@/lib/mvave/tkg";
import type { PedalModelConfig, PresetSettings } from "@/types/pedal";
import { Check, Download, FileUp, X } from "lucide-react";

/**
 * A ponte com o app oficial da pedaleira, nos dois sentidos:
 *
 * - na página de um envio, só o download — quem está vendo o preset dos outros
 *   quer levar para o aparelho, e mais nada;
 * - no envio de presets, só a leitura de um .tkg que a pessoa já tem no
 *   computador, que cai direto na pedaleira virtual.
 *
 * A importação nunca escreve no preset de primeira: mostra a configuração que
 * saiu do arquivo, com o que muda em destaque, e só aplica depois do "sim".
 */

/** Partes do nome do arquivo — o preset sozinho não diz de que música é. */
export type TkgFileParts = { song?: string; track?: string; preset?: string };

/**
 * Teto de leitura. Um preset da Tank-G tem 21 bytes; nada maior que isto é um
 * .tkg, e não há motivo para carregar o arquivo inteiro na memória só para
 * descobrir isso no decode.
 */
const MAX_FILE_BYTES = 4 * 1024;

export function TkgDownloadButton({
  model,
  settings,
  parts,
}: {
  model: { config: PedalModelConfig };
  settings: PresetSettings;
  parts: TkgFileParts;
}) {
  function download() {
    const url = URL.createObjectURL(
      new Blob([encodeTkg(model.config, settings)], {
        type: "application/octet-stream",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = tkgFileName(parts);
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${link.download} baixado — abra no app da pedaleira.`);
  }

  return (
    <Button variant="outline" size="sm" onClick={download}>
      <Download className="size-4" />
      Baixar .tkg
    </Button>
  );
}

export function TkgImportDialog({
  model,
  settings,
  onImport,
}: {
  model: { name: string; config: PedalModelConfig };
  /** Preset aberto, para o preview marcar o que o arquivo muda. */
  settings: PresetSettings;
  onImport: (settings: PresetSettings) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{
    fileName: string;
    settings: PresetSettings;
    rows: PresetSummaryRow[];
  } | null>(null);

  async function readFile(file: File) {
    try {
      if (file.size > MAX_FILE_BYTES) {
        throw new TkgError(
          `Esse arquivo tem ${Math.round(file.size / 1024)} KB; um preset da ${model.name} tem ${TKG_BYTE_LENGTH} bytes.`,
        );
      }
      const incoming = decodeTkg(
        model.config,
        new Uint8Array(await file.arrayBuffer()),
      );
      setPreview({
        fileName: file.name,
        settings: incoming,
        rows: summarizePreset(model.config, incoming, settings),
      });
    } catch (err) {
      setPreview(null);
      toast.error(
        err instanceof TkgError ? err.message : "Não consegui ler esse arquivo.",
      );
    }
  }

  function confirm() {
    if (!preview) return;
    onImport(preview.settings);
    setPreview(null);
    setOpen(false);
    toast.success("Preset do arquivo aplicado à pedaleira.");
  }

  function handleOpenChange(next: boolean) {
    // Fechar sem aplicar descarta o arquivo: reabrir começa do zero.
    if (!next) setPreview(null);
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <FileUp className="size-4" />
            Importar da pedaleira (.tkg)
          </Button>
        }
      />

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar da pedaleira</DialogTitle>
          <DialogDescription>
            Escolha um arquivo .tkg que você criou na {model.name}: eu mostro
            como ele fica na pedaleira virtual antes de aplicar ao preset.
          </DialogDescription>
        </DialogHeader>

        <div>
          <input
            ref={fileInput}
            type="file"
            accept=".tkg"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readFile(file);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => fileInput.current?.click()}>
            <FileUp className="size-4" />
            Escolher arquivo .tkg
          </Button>

          {preview && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent/[0.06] p-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-mono text-foreground">{preview.fileName}</span>{" "}
                — confira antes de aplicar. Em destaque, o que muda no preset atual.
              </p>

              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {preview.rows.map((row) => (
                  <li
                    key={row.blockId}
                    className="rounded-md border border-white/[0.08] bg-black/20 px-3 py-2"
                  >
                    <p className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider">
                      {row.blockLabel}
                      {row.switchable && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal",
                            row.enabled
                              ? "bg-neon-green/15 text-neon-green"
                              : "bg-white/[0.06] text-muted-foreground",
                          )}
                        >
                          {row.enabled ? "ligado" : "bypass"}
                        </span>
                      )}
                    </p>
                    <dl className="mt-1.5 space-y-0.5">
                      {row.params.map((param) => (
                        <div
                          key={param.id}
                          className="flex justify-between gap-3 text-xs"
                        >
                          <dt className="truncate text-muted-foreground">
                            {param.label}
                          </dt>
                          <dd
                            className={cn(
                              "font-mono tabular-nums",
                              param.changed && "font-bold text-accent",
                            )}
                          >
                            {param.text}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={confirm}>
                  <Check className="size-4" />
                  Aplicar ao preset
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
                  <X className="size-4" />
                  Descartar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
