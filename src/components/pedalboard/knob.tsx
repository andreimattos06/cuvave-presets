"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { KnobParam } from "@/types/pedal";

/**
 * Knob cromado serrilhado, no formato das Cuvave reais: corpo metálico que gira,
 * saia escura com escala de marcações e traço indicador no topo.
 * Interação: arraste vertical, scroll, setas do teclado; duplo clique reseta.
 */
const SWEEP_DEG = 270;
const START_DEG = -135;
const TICKS = 11;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function snap(v: number, min: number, step: number) {
  // Arredonda para o passo e corta o ruído de ponto flutuante (0.30000000000004).
  const snapped = Math.round((v - min) / step) * step + min;
  return Math.round(snapped * 1000) / 1000;
}

/**
 * Corta as casas irrelevantes das coordenadas SVG. Math.cos/sin podem divergir
 * no último dígito entre o V8 do Node e o do navegador, e essa diferença sozinha
 * já dispara erro de hidratação — que faz o React remontar a árvore e engolir
 * os primeiros cliques da página.
 */
function svgCoord(v: number) {
  return Math.round(v * 1000) / 1000;
}

const SIZE_CLASSES = {
  sm: "size-9",
  md: "size-11",
  lg: "size-14",
} as const;

export function Knob({
  param,
  value,
  onChange,
  colorVar = "var(--neon-cyan)",
  size = "md",
  disabled = false,
  onFocusValue,
}: {
  param: KnobParam;
  value: number;
  onChange: (value: number) => void;
  colorVar?: string;
  size?: keyof typeof SIZE_CLASSES;
  disabled?: boolean;
  onFocusValue?: (value: number | undefined) => void;
}) {
  const dragState = useRef<{ startY: number; startValue: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const { min, max, step } = param;
  const pct = clamp((value - min) / (max - min), 0, 1);
  const deg = START_DEG + pct * SWEEP_DEG;

  const commit = useCallback(
    (next: number) => {
      const v = clamp(snap(next, min, step), min, max);
      onChange(v);
      onFocusValue?.(v);
    },
    [onChange, onFocusValue, min, max, step],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.current) return;
      const deltaY = dragState.current.startY - e.clientY;
      // Shift = ajuste fino, como num controle real de estúdio.
      const sensitivity = e.shiftKey ? 420 : 140;
      commit(dragState.current.startValue + (deltaY / sensitivity) * (max - min));
    },
    [max, min, commit],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const big = step * 10;
      const moves: Record<string, number | "min" | "max"> = {
        ArrowUp: step,
        ArrowRight: step,
        ArrowDown: -step,
        ArrowLeft: -step,
        PageUp: big,
        PageDown: -big,
        Home: "min",
        End: "max",
      };
      const move = moves[e.key];
      if (move === undefined) return;
      e.preventDefault();
      if (move === "min") commit(min);
      else if (move === "max") commit(max);
      else commit(value + move);
    },
    [disabled, value, step, min, max, commit],
  );

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={param.label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-orientation="vertical"
        aria-disabled={disabled}
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragState.current = { startY: e.clientY, startValue: value };
          setDragging(true);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          dragState.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          dragState.current = null;
          setDragging(false);
        }}
        onPointerEnter={() => onFocusValue?.(value)}
        onPointerLeave={() => !dragging && onFocusValue?.(undefined)}
        onFocus={() => onFocusValue?.(value)}
        onBlur={() => onFocusValue?.(undefined)}
        onWheel={(e) => {
          if (disabled) return;
          commit(value + (e.deltaY > 0 ? -step : step));
        }}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => !disabled && commit(param.default)}
        className={cn(
          SIZE_CLASSES[size],
          "relative touch-none cursor-ns-resize rounded-full outline-none",
          "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {/* escala serigrafada ao redor do knob */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="absolute -inset-[18%] overflow-visible"
        >
          {Array.from({ length: TICKS }, (_, i) => {
            const a = ((START_DEG + (i / (TICKS - 1)) * SWEEP_DEG - 90) * Math.PI) / 180;
            const inner = 46;
            const outer = i % 5 === 0 ? 52 : 50;
            return (
              <line
                key={i}
                x1={svgCoord(50 + Math.cos(a) * inner)}
                y1={svgCoord(50 + Math.sin(a) * inner)}
                x2={svgCoord(50 + Math.cos(a) * outer)}
                y2={svgCoord(50 + Math.sin(a) * outer)}
                stroke="currentColor"
                strokeWidth={i % 5 === 0 ? 2.4 : 1.4}
                strokeLinecap="round"
                className="text-white/25"
              />
            );
          })}
          {/* arco de valor aceso, na cor do bloco */}
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke={colorVar}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${svgCoord((pct * SWEEP_DEG * Math.PI * 43) / 180)} 1000`}
            transform="rotate(135 50 50)"
            opacity={disabled ? 0.25 : 0.9}
          />
        </svg>

        {/* saia escura sob o botão */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#0b0b0d] shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),0_2px_5px_rgba(0,0,0,0.7)]"
        />

        {/* corpo cromado serrilhado que gira com o valor */}
        <motion.div
          aria-hidden
          className="absolute inset-[9%] rounded-full"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, #f2f2f4 0deg 2.5deg, #9a9aa2 2.5deg 5deg, #d9d9de 5deg 7.5deg)",
          }}
          animate={{ rotate: deg }}
          transition={
            dragging ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 28 }
          }
        >
          {/* topo abaulado do knob + brilho especular */}
          <div
            className="absolute inset-[14%] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 32% 26%, #ffffff 0%, #dcdce2 34%, #a6a6ae 62%, #6f6f78 100%)",
              boxShadow:
                "inset 0 -1px 2px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.9)",
            }}
          />
          {/* traço indicador */}
          <span className="absolute left-1/2 top-[13%] h-[30%] w-[2.5px] -translate-x-1/2 rounded-full bg-[#17171b] shadow-[0_0_1px_rgba(255,255,255,0.6)]" />
        </motion.div>
      </div>

      <span className="max-w-[4.5rem] text-center text-[9px] font-semibold uppercase leading-tight tracking-wider text-white/70">
        {param.label}
      </span>
    </div>
  );
}
