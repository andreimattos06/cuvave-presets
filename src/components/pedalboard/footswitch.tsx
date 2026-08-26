"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Footswitch cromado do tipo usado nas M-Vave: cúpula metálica polida sobre
 * uma porca sextavada, com afundamento real ao pisar.
 */
export function Footswitch({
  label,
  active,
  onToggle,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "group flex flex-col items-center gap-1.5 outline-none transition-opacity",
        disabled && "cursor-not-allowed",
        // só leitura mantém o switch legível; quem apaga é o estado desligado
        disabled && !active && "opacity-60",
      )}
    >
      <span className="relative block size-12">
        {/* porca sextavada / base fixa no chassis */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(#8e8e96 0deg, #cfcfd6 60deg, #6f6f77 120deg, #c4c4cb 200deg, #7a7a82 280deg, #b8b8c0 360deg)",
            boxShadow: "0 3px 6px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(0,0,0,0.35)",
          }}
        />
        {/* cúpula que afunda ao ser pisada */}
        <motion.span
          aria-hidden
          className="absolute inset-[13%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 34% 28%, #ffffff 0%, #e2e2e8 26%, #a9a9b2 58%, #62626b 88%, #8d8d96 100%)",
            boxShadow:
              "inset 0 -2px 3px rgba(0,0,0,0.5), inset 0 2px 2px rgba(255,255,255,0.9)",
          }}
          animate={{ y: 0 }}
          whileTap={disabled ? undefined : { y: 3, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 700, damping: 24 }}
        />
        {/* anel de foco por teclado */}
        <span className="pointer-events-none absolute -inset-1 rounded-full ring-white/80 group-focus-visible:ring-2" />
      </span>

      <span
        className={cn(
          "font-mono text-[11px] font-bold tracking-widest transition-colors",
          active ? "text-white" : "text-white/45",
        )}
      >
        {label}
      </span>
    </button>
  );
}
