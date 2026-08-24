"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { KnobParam } from "@/types/pedal";

/** Pedal de expressão: arraste vertical inclina a chapa (0 = talão, max = ponta). */
const MAX_TILT_DEG = 22;

export function ExpressionPedal({
  param,
  value,
  onChange,
  disabled = false,
}: {
  param: KnobParam;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const dragState = useRef<{ startY: number; startValue: number } | null>(null);
  const { min, max, step } = param;
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));

  const commit = useCallback(
    (next: number) => {
      const snapped = Math.round((next - min) / step) * step + min;
      onChange(Math.min(max, Math.max(min, snapped)));
    },
    [onChange, min, max, step],
  );

  return (
    <div className="flex items-center gap-5">
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={param.label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-orientation="vertical"
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragState.current = { startY: e.clientY, startValue: value };
        }}
        onPointerMove={(e) => {
          if (!dragState.current) return;
          const deltaY = dragState.current.startY - e.clientY;
          commit(dragState.current.startValue + (deltaY / 120) * (max - min));
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          dragState.current = null;
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowUp") {
            e.preventDefault();
            commit(value + step);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            commit(value - step);
          }
        }}
        className={cn(
          "relative h-16 w-32 touch-none cursor-ns-resize rounded-md outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          disabled && "cursor-not-allowed opacity-40",
        )}
        style={{ perspective: "320px" }}
      >
        <motion.div
          className="absolute inset-0 origin-bottom rounded-md border border-white/15 bg-gradient-to-b from-neutral-600 to-neutral-800"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 2px, transparent 2px, transparent 8px)",
          }}
          animate={{ rotateX: -pct * MAX_TILT_DEG }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {param.label}
        </p>
        <p className="font-mono text-lg tabular-nums text-foreground">
          {value.toFixed(1)}
        </p>
      </div>
    </div>
  );
}
