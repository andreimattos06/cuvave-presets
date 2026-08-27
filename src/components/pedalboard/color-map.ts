/**
 * Mapa estático de classes Tailwind por cor neon.
 * Precisa ser literal (não `text-${color}`) para o compilador do Tailwind
 * conseguir localizar as classes em tempo de build.
 */
const NEON_COLOR_CLASSES = {
  "neon-violet": {
    text: "text-neon-violet",
    bg: "bg-neon-violet",
    border: "border-neon-violet",
    glow: "shadow-[0_0_22px_-4px_var(--neon-violet)]",
    cssVar: "var(--neon-violet)",
  },
  "neon-cyan": {
    text: "text-neon-cyan",
    bg: "bg-neon-cyan",
    border: "border-neon-cyan",
    glow: "shadow-[0_0_22px_-4px_var(--neon-cyan)]",
    cssVar: "var(--neon-cyan)",
  },
  "neon-amber": {
    text: "text-neon-amber",
    bg: "bg-neon-amber",
    border: "border-neon-amber",
    glow: "shadow-[0_0_22px_-4px_var(--neon-amber)]",
    cssVar: "var(--neon-amber)",
  },
  "neon-rose": {
    text: "text-neon-rose",
    bg: "bg-neon-rose",
    border: "border-neon-rose",
    glow: "shadow-[0_0_22px_-4px_var(--neon-rose)]",
    cssVar: "var(--neon-rose)",
  },
  "neon-green": {
    text: "text-neon-green",
    bg: "bg-neon-green",
    border: "border-neon-green",
    glow: "shadow-[0_0_22px_-4px_var(--neon-green)]",
    cssVar: "var(--neon-green)",
  },
  "neon-red": {
    text: "text-neon-red",
    bg: "bg-neon-red",
    border: "border-neon-red",
    glow: "shadow-[0_0_22px_-4px_var(--neon-red)]",
    cssVar: "var(--neon-red)",
  },
  "neon-blue": {
    text: "text-neon-blue",
    bg: "bg-neon-blue",
    border: "border-neon-blue",
    glow: "shadow-[0_0_22px_-4px_var(--neon-blue)]",
    cssVar: "var(--neon-blue)",
  },
  "neon-emerald": {
    text: "text-neon-emerald",
    bg: "bg-neon-emerald",
    border: "border-neon-emerald",
    glow: "shadow-[0_0_22px_-4px_var(--neon-emerald)]",
    cssVar: "var(--neon-emerald)",
  },
  "neon-white": {
    text: "text-neon-white",
    bg: "bg-neon-white",
    border: "border-neon-white",
    glow: "shadow-[0_0_22px_-4px_var(--neon-white)]",
    cssVar: "var(--neon-white)",
  },
} as const;

type NeonColorId = keyof typeof NEON_COLOR_CLASSES;

export function getNeonColor(id: string) {
  return NEON_COLOR_CLASSES[id as NeonColorId] ?? NEON_COLOR_CLASSES["neon-violet"];
}
