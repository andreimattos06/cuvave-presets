"use client";

import { cn } from "@/lib/utils";

/** LED indicador — nas M-Vave reais eles ficam logo acima de cada knob e brilham forte. */
export function Led({
  color,
  on,
  size = "md",
  className,
}: {
  color: string;
  on: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const px = size === "sm" ? 5 : 7;

  return (
    <span
      aria-hidden
      className={cn("inline-block rounded-full transition-all duration-200", className)}
      style={{
        width: px,
        height: px,
        background: on ? color : "rgba(255,255,255,0.10)",
        boxShadow: on
          ? `0 0 4px 1px ${color}, 0 0 12px 3px color-mix(in oklab, ${color} 60%, transparent)`
          : "inset 0 1px 1px rgba(0,0,0,0.6)",
      }}
    />
  );
}
