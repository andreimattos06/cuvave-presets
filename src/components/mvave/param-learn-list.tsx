"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { flattenParams, paramKey, type DeviceMap } from "@/lib/mvave/param-map";
import type { PedalModelConfig } from "@/types/pedal";
import { Crosshair, X } from "lucide-react";

/**
 * Lista "knob por knob" para ensinar ao site qual Control Change o aparelho
 * manda em cada controle. Um clique em Aprender arma a escuta; o usuário mexe
 * no knob real e o CC que chegar fica gravado.
 */
export function ParamLearnList({
  config,
  map,
  learningKey,
  onLearn,
  onForget,
}: {
  config: PedalModelConfig;
  map: DeviceMap;
  learningKey: string | null;
  onLearn: (key: string | null) => void;
  onForget: (key: string) => void;
}) {
  const items = flattenParams(config);

  return (
    <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
      {items.map(({ ref, label }) => {
        const key = paramKey(ref);
        const binding = map[key];
        const learning = learningKey === key;

        return (
          <li
            key={key}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
              learning
                ? "border-accent/50 bg-accent/10"
                : "border-white/[0.06] bg-white/[0.02]",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{label}</span>

            {binding ? (
              <span className="font-mono text-xs text-muted-foreground">
                CC {binding.controller} · ch {binding.channel}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">sem CC</span>
            )}

            <Button
              variant={learning ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onLearn(learning ? null : key)}
            >
              <Crosshair className="size-3.5" />
              {learning ? "Ouvindo…" : "Aprender"}
            </Button>

            {binding && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Esquecer o CC de ${label}`}
                onClick={() => onForget(key)}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
