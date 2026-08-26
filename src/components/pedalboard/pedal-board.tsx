"use client";

import { Fragment, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Knob } from "./knob";
import { Led } from "./led";
import { Footswitch } from "./footswitch";
import { ArcLabel } from "./arc-label";
import { SevenSegment } from "./seven-segment";
import { ExpressionPedal } from "./expression-pedal";
import { FitRow } from "./fit-row";
import { getNeonColor } from "./color-map";
import {
  createDefaultPresetSettings,
  formatParamValue,
  type EffectBlockConfig,
  type KnobParam,
  type PedalModelConfig,
  type PresetSettings,
} from "@/types/pedal";

type Focus = { label: string; text: string } | null;

/** Parafuso de chassis — detalhe que vende o "objeto real". */
function Screw({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute size-2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#e8e8ee,#6f6f78_60%,#3a3a40)]",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.4),0_1px_1px_rgba(255,255,255,0.15)]",
        className,
      )}
    >
      <span className="absolute left-1/2 top-1/2 h-[1px] w-[70%] -translate-x-1/2 -translate-y-1/2 rotate-[35deg] bg-black/60" />
    </span>
  );
}

export function PedalBoard({
  modelName,
  config,
  presetName = "",
  value,
  onChange,
  readOnly = false,
  className,
}: {
  modelName: string;
  config: PedalModelConfig;
  presetName?: string;
  value?: PresetSettings;
  onChange?: (settings: PresetSettings) => void;
  readOnly?: boolean;
  className?: string;
}) {
  const [focus, setFocus] = useState<Focus>(null);

  const settings = useMemo(
    () => value ?? createDefaultPresetSettings(config),
    [value, config],
  );

  const metallic = config.chassisFinish === "metallic";
  const brand = config.brand ?? "M-VAVE";
  const globalLed = config.globalLedColor
    ? getNeonColor(config.globalLedColor).cssVar
    : "#f5f5f5";

  const activeCount = config.effectBlocks.filter(
    (b) => settings.blocks[b.id]?.enabled,
  ).length;

  function update(next: PresetSettings) {
    if (readOnly) return;
    onChange?.(next);
  }

  function toggleBlock(blockId: string) {
    const current = settings.blocks[blockId];
    if (!current) return;
    update({
      ...settings,
      blocks: {
        ...settings.blocks,
        [blockId]: { ...current, enabled: !current.enabled },
      },
    });
  }

  function setBlockParam(blockId: string, paramId: string, paramValue: number) {
    const current = settings.blocks[blockId];
    if (!current) return;
    update({
      ...settings,
      blocks: {
        ...settings.blocks,
        [blockId]: {
          ...current,
          params: { ...current.params, [paramId]: paramValue },
        },
      },
    });
  }

  function blockSettingsOf(block: EffectBlockConfig) {
    return (
      settings.blocks[block.id] ?? {
        enabled: true,
        params: Object.fromEntries(block.params.map((p) => [p.id, p.default])),
      }
    );
  }

  const expressionParam = config.globalKnobs.find((k) => k.id === "expression");
  const dialKnobs = config.globalKnobs.filter((k) => k.id !== "expression");

  function focusOf(label: string, param: KnobParam) {
    return (v: number | undefined) =>
      setFocus(v === undefined ? null : { label, text: formatParamValue(param, v) });
  }

  const readoutLabel = focus ? focus.label : "blocos ativos";
  const readoutText = focus ? focus.text : String(activeCount);
  // No Tank-G o display de LED fica no meio da fileira de pedais, entre B e C.
  const segment = config.hasSevenSegment ? (
    <SevenSegment text={readoutText} label={readoutLabel} />
  ) : null;
  const segmentIndex = Math.floor(config.footswitches.length / 2);
  const segmentInRow = segment !== null && config.footswitches.length > 0;

  return (
    <div
      className={cn("relative rounded-[14px] p-[3px]", className)}
      style={{
        // bisel externo: luz vinda de cima, sombra embaixo
        background: metallic
          ? `linear-gradient(180deg, color-mix(in oklab, ${config.chassisColor} 55%, white) 0%, color-mix(in oklab, ${config.chassisColor} 60%, black) 100%)`
          : "linear-gradient(180deg, #45454d 0%, #0a0a0c 100%)",
        boxShadow: "0 18px 40px -12px rgba(0,0,0,0.85)",
      }}
    >
      <div
        className="relative overflow-hidden rounded-[12px] px-5 py-4 sm:px-7 sm:py-5"
        style={{
          background: metallic
            ? `linear-gradient(168deg, color-mix(in oklab, ${config.chassisColor} 88%, white) 0%, ${config.chassisColor} 42%, color-mix(in oklab, ${config.chassisColor} 72%, black) 100%)`
            : `linear-gradient(168deg, color-mix(in oklab, ${config.chassisColor} 82%, white) 0%, ${config.chassisColor} 38%, color-mix(in oklab, ${config.chassisColor} 78%, black) 100%)`,
        }}
      >
        {/* textura de metal escovado / pintura */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(94deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 3px)",
          }}
        />
        {/* reflexo diagonal do verniz */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-24 h-40 rotate-[8deg] opacity-25"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",
          }}
        />

        <Screw className="left-2 top-2" />
        <Screw className="right-2 top-2" />
        <Screw className="bottom-2 left-2" />
        <Screw className="bottom-2 right-2" />

        {/* ── cabeçalho serigrafado ───────────────────────────── */}
        <div className="relative mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className="font-heading text-lg font-extrabold italic leading-none tracking-tight text-white/90"
              style={{ textShadow: "0 1px 0 rgba(0,0,0,0.6)" }}
            >
              {brand}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
              {modelName}
            </p>
          </div>

          {presetName && (
            // etiqueta de fita, como músico marca o pedal de verdade
            <span
              className="hidden max-w-[14rem] -rotate-1 truncate rounded-[2px] bg-[#e9e4d3] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#22201a] shadow-[0_1px_3px_rgba(0,0,0,0.6)] sm:block"
              title={presetName}
            >
              {presetName}
            </span>
          )}

          {segmentInRow ? null : segment ? (
            segment
          ) : (
            // Modelos sem display (Baby) ganham um readout discreto, para o
            // usuário enxergar o valor exato que está ajustando.
            <div className="min-w-[6.5rem] text-right" role="status">
              <p className="truncate text-[9px] font-semibold uppercase tracking-widest text-white/45">
                {readoutLabel}
              </p>
              <p className="font-mono text-xl font-bold leading-tight tabular-nums text-white/90">
                {readoutText}
              </p>
            </div>
          )}
        </div>

        {/* ── fileira de knobs ────────────────────────────────── */}
        <FitRow className="relative" innerClassName="items-end gap-x-4">
          {dialKnobs.length > 0 && (
            <KnobGroup
              title="Master"
              color={globalLed}
              enabled
              onToggle={undefined}
            >
              {dialKnobs.map((knob) => (
                <div key={knob.id} className="flex flex-col items-center gap-1.5">
                  <Led color={globalLed} on />
                  <Knob
                    param={knob}
                    value={settings.globalKnobs[knob.id] ?? knob.default}
                    colorVar={globalLed}
                    disabled={readOnly}
                    onChange={(v) =>
                      update({
                        ...settings,
                        globalKnobs: { ...settings.globalKnobs, [knob.id]: v },
                      })
                    }
                    onFocusValue={focusOf(knob.label, knob)}
                  />
                </div>
              ))}
            </KnobGroup>
          )}

          {config.effectBlocks.map((block) => {
            const bs = blockSettingsOf(block);
            const color = getNeonColor(block.color).cssVar;
            return (
              <KnobGroup
                key={block.id}
                title={block.label}
                color={color}
                enabled={bs.enabled}
                onToggle={readOnly ? undefined : () => toggleBlock(block.id)}
              >
                {block.params.map((param) => (
                  <div key={param.id} className="flex flex-col items-center gap-1.5">
                    <Led color={color} on={bs.enabled} />
                    <Knob
                      param={param}
                      value={bs.params[param.id] ?? param.default}
                      colorVar={color}
                      disabled={readOnly || !bs.enabled}
                      off={!bs.enabled}
                      onChange={(v) => setBlockParam(block.id, param.id, v)}
                      onFocusValue={focusOf(legendOf(block.label, param.label), param)}
                    />
                  </div>
                ))}
              </KnobGroup>
            );
          })}
        </FitRow>

        {/* ── footswitches ────────────────────────────────────── */}
        {config.footswitches.length > 0 && (
          <div className="relative mt-6 border-t border-white/10 pt-5">
            <FitRow innerClassName="items-start gap-x-6">
              {config.footswitches.map((fs, i) => {
                const target = fs.togglesBlockId;
                const block = config.effectBlocks.find((b) => b.id === target);
                const on = target ? (settings.blocks[target]?.enabled ?? false) : false;
                const color = block ? getNeonColor(block.color).cssVar : globalLed;
                return (
                  <Fragment key={fs.id}>
                    {segmentInRow && i === segmentIndex && (
                      <div className="self-center">{segment}</div>
                    )}
                    <div className="flex flex-col items-center">
                      <ArcLabel
                        left={fs.arcLabel ?? block?.label ?? fs.label}
                        ledColor={color}
                        ledOn={on}
                      />
                      <Footswitch
                        label={fs.label}
                        active={on}
                        disabled={readOnly || !target}
                        onToggle={() => target && toggleBlock(target)}
                      />
                    </div>
                  </Fragment>
                );
              })}
            </FitRow>
          </div>
        )}

        {config.hasExpressionPedal && expressionParam && (
          <div className="relative mt-6 border-t border-white/10 pt-5">
            <ExpressionPedal
              param={expressionParam}
              value={
                settings.globalKnobs[expressionParam.id] ?? expressionParam.default
              }
              disabled={readOnly}
              onChange={(v) =>
                update({
                  ...settings,
                  globalKnobs: { ...settings.globalKnobs, [expressionParam.id]: v },
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Legenda do display. Quando um nome já contém o outro ("Mod" / "Mod Speed",
 * "Noise Gate" / "Gate"), repetir vira ruído — fica só o mais descritivo.
 */
function legendOf(blockLabel: string, paramLabel: string) {
  const b = blockLabel.toLowerCase();
  const p = paramLabel.toLowerCase();
  if (p.includes(b)) return paramLabel;
  if (b.includes(p)) return blockLabel;
  // Serigrafia de duas palavras ("Rvb Decay", "Dly Mix") já diz de que bloco é.
  if (paramLabel.includes(" ")) return paramLabel;
  return `${blockLabel} ${paramLabel}`;
}

/** Agrupamento serigrafado de knobs; o título liga/desliga o bloco. */
function KnobGroup({
  title,
  color,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  color: string;
  enabled: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  const heading = (
    <span
      className="text-[9px] font-bold uppercase tracking-[0.18em] transition-colors"
      style={{ color: enabled ? color : "rgba(255,255,255,0.3)" }}
    >
      {title}
    </span>
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-md px-2 py-1 transition-opacity",
        !enabled && "opacity-55",
      )}
    >
      {onToggle ? (
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? "Desligar" : "Ligar"} ${title}`}
          onClick={onToggle}
          className="rounded outline-none hover:brightness-125 focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {heading}
        </button>
      ) : (
        heading
      )}
      <div className="flex items-end gap-2.5">{children}</div>
    </div>
  );
}
