"use client";

import { Button } from "@/components/ui/button";
import { toHex, type MidiMessage } from "@/lib/mvave/midi";
import { Download, Eraser } from "lucide-react";

/**
 * Espelho do que a pedaleira está mandando. Serve para conferir se ela fala
 * MIDI de verdade e para salvar o dump SysEx — é dele que sai o mapeamento do
 * formato proprietário de preset, que a M-Vave não documenta.
 */
export function MidiMonitor({
  messages,
  onClear,
}: {
  messages: MidiMessage[];
  onClear: () => void;
}) {
  function download() {
    const text = messages
      .slice()
      .reverse()
      .map((m) => `${new Date(m.at).toISOString()}  ${m.label}\n${toHex(m.data)}`)
      .join("\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "mvave-midi-dump.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/30">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Monitor MIDI
        </span>
        <span className="text-xs text-muted-foreground">{messages.length}</span>
        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="sm" onClick={onClear} disabled={!messages.length}>
            <Eraser className="size-3.5" />
            Limpar
          </Button>
          <Button variant="ghost" size="sm" onClick={download} disabled={!messages.length}>
            <Download className="size-3.5" />
            Baixar dump
          </Button>
        </div>
      </div>

      <ul className="max-h-40 overflow-y-auto p-2 font-mono text-[11px] leading-relaxed">
        {messages.length === 0 ? (
          <li className="px-1 py-2 text-muted-foreground">
            Nada ainda — mexa em um knob ou pise num footswitch da pedaleira.
          </li>
        ) : (
          messages.map((m) => (
            <li key={`${m.at}-${m.label}`} className="px-1 text-white/70">
              {m.label}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
